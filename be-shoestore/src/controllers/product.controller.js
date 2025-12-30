const { getPool, sql } = require('../config/database');
const { deleteFile } = require('../middlewares/upload.middleware');

// @desc    Lấy danh sách sản phẩm (có filter, search, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search = '',
            category,
            brand,
            gender,
            minPrice,
            maxPrice,
            size,
            color,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const pool = getPool();
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Xây dựng điều kiện WHERE
        let whereConditions = ['p.status = \'active\''];
        const request = pool.request();

        if (search) {
            whereConditions.push('(p.product_name LIKE @search OR p.description LIKE @search)');
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        if (category) {
            whereConditions.push('p.category_id = @category');
            request.input('category', sql.Int, category);
        }

        if (brand) {
            whereConditions.push('p.brand_id = @brand');
            request.input('brand', sql.Int, brand);
        }

        if (gender) {
            whereConditions.push('(p.gender = @gender OR p.gender = \'unisex\')');
            request.input('gender', sql.VarChar, gender);
        }

        if (minPrice) {
            whereConditions.push('p.base_price >= @minPrice');
            request.input('minPrice', sql.Decimal, minPrice);
        }

        if (maxPrice) {
            whereConditions.push('p.base_price <= @maxPrice');
            request.input('maxPrice', sql.Decimal, maxPrice);
        }

        // Filter theo size
        if (size) {
            whereConditions.push(`
                EXISTS (
                    SELECT 1 FROM ProductVariants pv 
                    WHERE pv.product_id = p.product_id 
                    AND pv.size = @size AND pv.status = 'active' AND pv.stock_quantity > 0
                )
            `);
            request.input('size', sql.NVarChar, size);
        }

        // Filter theo màu
        if (color) {
            whereConditions.push(`
                EXISTS (
                    SELECT 1 FROM ProductVariants pv 
                    WHERE pv.product_id = p.product_id 
                    AND pv.color = @color AND pv.status = 'active' AND pv.stock_quantity > 0
                )
            `);
            request.input('color', sql.NVarChar, color);
        }

        const whereClause = whereConditions.join(' AND ');

        // Validate sort options
        const validSortFields = ['created_at', 'base_price', 'product_name', 'sold_count', 'view_count'];
        const validSortOrders = ['ASC', 'DESC'];
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        // Query lấy sản phẩm
        const productsQuery = `
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                p.base_price,
                p.gender,
                p.view_count,
                p.sold_count,
                p.created_at,
                c.category_id,
                c.category_name,
                b.brand_id,
                b.brand_name,
                (SELECT TOP 1 image_url FROM ProductImages WHERE product_id = p.product_id AND is_primary = 1) as primary_image,
                (SELECT AVG(CAST(rating AS FLOAT)) FROM Reviews WHERE product_id = p.product_id AND status = 'approved') as avg_rating,
                (SELECT COUNT(*) FROM Reviews WHERE product_id = p.product_id AND status = 'approved') as review_count,
                (SELECT MIN(ISNULL(price, p.base_price)) FROM ProductVariants WHERE product_id = p.product_id AND status = 'active') as min_price,
                (SELECT MAX(ISNULL(price, p.base_price)) FROM ProductVariants WHERE product_id = p.product_id AND status = 'active') as max_price,
                (SELECT SUM(stock_quantity) FROM ProductVariants WHERE product_id = p.product_id AND status = 'active') as total_stock
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.category_id
            LEFT JOIN Brands b ON p.brand_id = b.brand_id
            WHERE ${whereClause}
            ORDER BY p.${finalSortBy} ${finalSortOrder}
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const productsResult = await request.query(productsQuery);

        // Query đếm tổng số sản phẩm
        const countQuery = `
            SELECT COUNT(*) as total
            FROM Products p
            WHERE ${whereClause}
        `;
        
        const countRequest = pool.request();
        if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
        if (category) countRequest.input('category', sql.Int, category);
        if (brand) countRequest.input('brand', sql.Int, brand);
        if (gender) countRequest.input('gender', sql.VarChar, gender);
        if (minPrice) countRequest.input('minPrice', sql.Decimal, minPrice);
        if (maxPrice) countRequest.input('maxPrice', sql.Decimal, maxPrice);
        if (size) countRequest.input('size', sql.NVarChar, size);
        if (color) countRequest.input('color', sql.NVarChar, color);

        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;

        res.json({
            success: true,
            data: {
                products: productsResult.recordset.map(p => ({
                    id: p.product_id,
                    name: p.product_name,
                    description: p.description,
                    basePrice: p.base_price,
                    minPrice: p.min_price,
                    maxPrice: p.max_price,
                    gender: p.gender,
                    viewCount: p.view_count,
                    soldCount: p.sold_count,
                    category: {
                        id: p.category_id,
                        name: p.category_name
                    },
                    brand: {
                        id: p.brand_id,
                        name: p.brand_name
                    },
                    primaryImage: p.primary_image,
                    avgRating: p.avg_rating ? parseFloat(p.avg_rating.toFixed(1)) : 0,
                    reviewCount: p.review_count,
                    totalStock: p.total_stock || 0,
                    createdAt: p.created_at
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách sản phẩm'
        });
    }
};

// @desc    Lấy chi tiết sản phẩm
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Tăng view count
        await pool.request()
            .input('productId', sql.Int, id)
            .query('UPDATE Products SET view_count = view_count + 1 WHERE product_id = @productId');

        // Lấy thông tin sản phẩm
        const productResult = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT 
                    p.*,
                    c.category_name,
                    b.brand_name,
                    b.logo as brand_logo
                FROM Products p
                LEFT JOIN Categories c ON p.category_id = c.category_id
                LEFT JOIN Brands b ON p.brand_id = b.brand_id
                WHERE p.product_id = @productId AND p.status = 'active'
            `);

        if (productResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        const product = productResult.recordset[0];

        // Lấy variants
        const variantsResult = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT variant_id, size, color, color_code, sku, price, stock_quantity
                FROM ProductVariants
                WHERE product_id = @productId AND status = 'active'
                ORDER BY size, color
            `);

        // Lấy ảnh sản phẩm
        const imagesResult = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT image_id, image_url, is_primary, color, sort_order
                FROM ProductImages
                WHERE product_id = @productId
                ORDER BY is_primary DESC, sort_order
            `);

        // Lấy reviews
        const reviewsResult = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT TOP 5
                    r.review_id,
                    r.rating,
                    r.title,
                    r.comment,
                    r.images,
                    r.created_at,
                    r.admin_reply,
                    r.replied_at,
                    u.full_name,
                    u.avatar
                FROM Reviews r
                JOIN Users u ON r.user_id = u.user_id
                WHERE r.product_id = @productId AND r.status = 'approved'
                ORDER BY r.created_at DESC
            `);

        // Tính rating summary
        const ratingResult = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT 
                    AVG(CAST(rating AS FLOAT)) as avg_rating,
                    COUNT(*) as total_reviews,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
                FROM Reviews
                WHERE product_id = @productId AND status = 'approved'
            `);

        const ratingSummary = ratingResult.recordset[0];

        // Lấy unique sizes và colors
        const sizes = [...new Set(variantsResult.recordset.map(v => v.size))];
        const colors = [...new Set(variantsResult.recordset.map(v => ({ 
            name: v.color, 
            code: v.color_code 
        })))];

        res.json({
            success: true,
            data: {
                id: product.product_id,
                name: product.product_name,
                description: product.description,
                basePrice: product.base_price,
                material: product.material,
                gender: product.gender,
                productType: product.product_type,
                viewCount: product.view_count,
                soldCount: product.sold_count,
                createdAt: product.created_at,
                category: {
                    id: product.category_id,
                    name: product.category_name
                },
                brand: {
                    id: product.brand_id,
                    name: product.brand_name,
                    logo: product.brand_logo
                },
                variants: variantsResult.recordset.map(v => ({
                    id: v.variant_id,
                    size: v.size,
                    color: v.color,
                    colorCode: v.color_code,
                    sku: v.sku,
                    price: v.price || product.base_price,
                    stock: v.stock_quantity
                })),
                images: imagesResult.recordset.map(i => ({
                    id: i.image_id,
                    url: i.image_url,
                    isPrimary: i.is_primary,
                    color: i.color
                })),
                sizes,
                colors: [...new Map(colors.map(c => [c.name, c])).values()],
                rating: {
                    average: ratingSummary.avg_rating ? parseFloat(ratingSummary.avg_rating.toFixed(1)) : 0,
                    total: ratingSummary.total_reviews || 0,
                    distribution: {
                        5: ratingSummary.five_star || 0,
                        4: ratingSummary.four_star || 0,
                        3: ratingSummary.three_star || 0,
                        2: ratingSummary.two_star || 0,
                        1: ratingSummary.one_star || 0
                    }
                },
                reviews: reviewsResult.recordset.map(r => ({
                    id: r.review_id,
                    rating: r.rating,
                    title: r.title,
                    comment: r.comment,
                    images: r.images ? JSON.parse(r.images) : [],
                    createdAt: r.created_at,
                    user: {
                        name: r.full_name,
                        avatar: r.avatar
                    },
                    adminReply: r.admin_reply,
                    repliedAt: r.replied_at
                }))
            }
        });

    } catch (error) {
        console.error('Get product by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy chi tiết sản phẩm'
        });
    }
};

// @desc    Tạo sản phẩm mới (Admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const {
            productName,
            description,
            basePrice,
            categoryId,
            brandId,
            material,
            gender = 'unisex',
            productType,
            variants
        } = req.body;

        const pool = getPool();

        // Tạo sản phẩm
        const productResult = await pool.request()
            .input('productName', sql.NVarChar, productName)
            .input('description', sql.NVarChar, description)
            .input('basePrice', sql.Decimal, basePrice)
            .input('categoryId', sql.Int, categoryId)
            .input('brandId', sql.Int, brandId)
            .input('material', sql.NVarChar, material)
            .input('gender', sql.VarChar, gender)
            .input('productType', sql.NVarChar, productType)
            .input('createdBy', sql.Int, req.user.userId)
            .query(`
                INSERT INTO Products (product_name, description, base_price, category_id, brand_id, material, gender, product_type, created_by)
                OUTPUT INSERTED.product_id
                VALUES (@productName, @description, @basePrice, @categoryId, @brandId, @material, @gender, @productType, @createdBy)
            `);

        const productId = productResult.recordset[0].product_id;

        // Tạo variants nếu có
        if (variants && variants.length > 0) {
            for (const variant of variants) {
                await pool.request()
                    .input('productId', sql.Int, productId)
                    .input('size', sql.NVarChar, variant.size)
                    .input('color', sql.NVarChar, variant.color)
                    .input('colorCode', sql.NVarChar, variant.colorCode)
                    .input('sku', sql.NVarChar, variant.sku)
                    .input('price', sql.Decimal, variant.price || null)
                    .input('stockQuantity', sql.Int, variant.stockQuantity || 0)
                    .query(`
                        INSERT INTO ProductVariants (product_id, size, color, color_code, sku, price, stock_quantity)
                        VALUES (@productId, @size, @color, @colorCode, @sku, @price, @stockQuantity)
                    `);
            }
        }

        // Upload ảnh nếu có
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                await pool.request()
                    .input('productId', sql.Int, productId)
                    .input('imageUrl', sql.NVarChar, `/uploads/products/${file.filename}`)
                    .input('isPrimary', sql.Bit, i === 0 ? 1 : 0)
                    .input('sortOrder', sql.Int, i)
                    .query(`
                        INSERT INTO ProductImages (product_id, image_url, is_primary, sort_order)
                        VALUES (@productId, @imageUrl, @isPrimary, @sortOrder)
                    `);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            data: {
                productId
            }
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo sản phẩm'
        });
    }
};

// @desc    Cập nhật sản phẩm (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            productName,
            description,
            basePrice,
            categoryId,
            brandId,
            material,
            gender,
            productType,
            status
        } = req.body;

        const pool = getPool();

        // Kiểm tra sản phẩm tồn tại
        const checkResult = await pool.request()
            .input('productId', sql.Int, id)
            .query('SELECT product_id FROM Products WHERE product_id = @productId');

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Cập nhật sản phẩm
        await pool.request()
            .input('productId', sql.Int, id)
            .input('productName', sql.NVarChar, productName)
            .input('description', sql.NVarChar, description)
            .input('basePrice', sql.Decimal, basePrice)
            .input('categoryId', sql.Int, categoryId)
            .input('brandId', sql.Int, brandId)
            .input('material', sql.NVarChar, material)
            .input('gender', sql.VarChar, gender)
            .input('productType', sql.NVarChar, productType)
            .input('status', sql.VarChar, status)
            .query(`
                UPDATE Products
                SET product_name = @productName,
                    description = @description,
                    base_price = @basePrice,
                    category_id = @categoryId,
                    brand_id = @brandId,
                    material = @material,
                    gender = @gender,
                    product_type = @productType,
                    status = @status,
                    updated_at = GETDATE()
                WHERE product_id = @productId
            `);

        res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công'
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật sản phẩm'
        });
    }
};

// @desc    Xóa sản phẩm (Admin) - Soft delete
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Kiểm tra sản phẩm có đơn hàng chưa hoàn thành không
        const orderCheck = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT COUNT(*) as count
                FROM OrderItems oi
                JOIN ProductVariants pv ON oi.variant_id = pv.variant_id
                JOIN Orders o ON oi.order_id = o.order_id
                WHERE pv.product_id = @productId 
                AND o.status NOT IN ('delivered', 'cancelled', 'returned')
            `);

        if (orderCheck.recordset[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa sản phẩm đang có đơn hàng chưa hoàn thành'
            });
        }

        // Soft delete - chuyển status thành inactive
        await pool.request()
            .input('productId', sql.Int, id)
            .query('UPDATE Products SET status = \'inactive\', updated_at = GETDATE() WHERE product_id = @productId');

        res.json({
            success: true,
            message: 'Xóa sản phẩm thành công'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa sản phẩm'
        });
    }
};

// @desc    Thêm/cập nhật variant sản phẩm (Admin)
// @route   POST /api/products/:id/variants
// @access  Private/Admin
const addProductVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const { size, color, colorCode, sku, price, stockQuantity } = req.body;

        const pool = getPool();

        // Kiểm tra variant đã tồn tại chưa
        const existingVariant = await pool.request()
            .input('productId', sql.Int, id)
            .input('size', sql.NVarChar, size)
            .input('color', sql.NVarChar, color)
            .query(`
                SELECT variant_id FROM ProductVariants 
                WHERE product_id = @productId AND size = @size AND color = @color
            `);

        if (existingVariant.recordset.length > 0) {
            // Cập nhật variant existing
            await pool.request()
                .input('variantId', sql.Int, existingVariant.recordset[0].variant_id)
                .input('colorCode', sql.NVarChar, colorCode)
                .input('sku', sql.NVarChar, sku)
                .input('price', sql.Decimal, price)
                .input('stockQuantity', sql.Int, stockQuantity)
                .query(`
                    UPDATE ProductVariants
                    SET color_code = @colorCode, sku = @sku, price = @price, 
                        stock_quantity = @stockQuantity, updated_at = GETDATE()
                    WHERE variant_id = @variantId
                `);

            return res.json({
                success: true,
                message: 'Cập nhật variant thành công'
            });
        }

        // Tạo variant mới
        const result = await pool.request()
            .input('productId', sql.Int, id)
            .input('size', sql.NVarChar, size)
            .input('color', sql.NVarChar, color)
            .input('colorCode', sql.NVarChar, colorCode)
            .input('sku', sql.NVarChar, sku)
            .input('price', sql.Decimal, price)
            .input('stockQuantity', sql.Int, stockQuantity)
            .query(`
                INSERT INTO ProductVariants (product_id, size, color, color_code, sku, price, stock_quantity)
                OUTPUT INSERTED.variant_id
                VALUES (@productId, @size, @color, @colorCode, @sku, @price, @stockQuantity)
            `);

        res.status(201).json({
            success: true,
            message: 'Thêm variant thành công',
            data: {
                variantId: result.recordset[0].variant_id
            }
        });

    } catch (error) {
        console.error('Add variant error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm variant'
        });
    }
};

// @desc    Upload ảnh sản phẩm (Admin)
// @route   POST /api/products/:id/images
// @access  Private/Admin
const uploadProductImages = async (req, res) => {
    try {
        const { id } = req.params;
        const { color } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ảnh để upload'
            });
        }

        const pool = getPool();

        // Lấy số thứ tự cao nhất hiện tại
        const maxOrderResult = await pool.request()
            .input('productId', sql.Int, id)
            .query('SELECT MAX(sort_order) as maxOrder FROM ProductImages WHERE product_id = @productId');
        
        let currentOrder = (maxOrderResult.recordset[0].maxOrder || 0) + 1;

        const uploadedImages = [];

        for (const file of req.files) {
            const result = await pool.request()
                .input('productId', sql.Int, id)
                .input('imageUrl', sql.NVarChar, `/uploads/products/${file.filename}`)
                .input('isPrimary', sql.Bit, 0)
                .input('sortOrder', sql.Int, currentOrder++)
                .input('color', sql.NVarChar, color)
                .query(`
                    INSERT INTO ProductImages (product_id, image_url, is_primary, sort_order, color)
                    OUTPUT INSERTED.image_id, INSERTED.image_url
                    VALUES (@productId, @imageUrl, @isPrimary, @sortOrder, @color)
                `);

            uploadedImages.push(result.recordset[0]);
        }

        res.json({
            success: true,
            message: 'Upload ảnh thành công',
            data: {
                images: uploadedImages
            }
        });

    } catch (error) {
        console.error('Upload images error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi upload ảnh'
        });
    }
};

// @desc    Lấy sản phẩm liên quan
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 4 } = req.query;

        const pool = getPool();

        // Lấy category và brand của sản phẩm hiện tại
        const currentProduct = await pool.request()
            .input('productId', sql.Int, id)
            .query('SELECT category_id, brand_id FROM Products WHERE product_id = @productId');

        if (currentProduct.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        const { category_id, brand_id } = currentProduct.recordset[0];

        // Lấy sản phẩm liên quan
        const relatedResult = await pool.request()
            .input('productId', sql.Int, id)
            .input('categoryId', sql.Int, category_id)
            .input('brandId', sql.Int, brand_id)
            .input('limit', sql.Int, parseInt(limit))
            .query(`
                SELECT TOP (@limit)
                    p.product_id,
                    p.product_name,
                    p.base_price,
                    b.brand_name,
                    (SELECT TOP 1 image_url FROM ProductImages WHERE product_id = p.product_id AND is_primary = 1) as primary_image,
                    (SELECT AVG(CAST(rating AS FLOAT)) FROM Reviews WHERE product_id = p.product_id AND status = 'approved') as avg_rating
                FROM Products p
                LEFT JOIN Brands b ON p.brand_id = b.brand_id
                WHERE p.product_id != @productId 
                AND p.status = 'active'
                AND (p.category_id = @categoryId OR p.brand_id = @brandId)
                ORDER BY 
                    CASE WHEN p.category_id = @categoryId AND p.brand_id = @brandId THEN 0
                         WHEN p.category_id = @categoryId THEN 1
                         ELSE 2 END,
                    p.sold_count DESC
            `);

        res.json({
            success: true,
            data: relatedResult.recordset.map(p => ({
                id: p.product_id,
                name: p.product_name,
                price: p.base_price,
                brand: p.brand_name,
                image: p.primary_image,
                rating: p.avg_rating ? parseFloat(p.avg_rating.toFixed(1)) : 0
            }))
        });

    } catch (error) {
        console.error('Get related products error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    addProductVariant,
    uploadProductImages,
    getRelatedProducts
};
