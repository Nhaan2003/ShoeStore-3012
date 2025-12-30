const { getPool, sql } = require('../config/database');

// @desc    Lấy tất cả danh mục
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const { includeInactive = false } = req.query;
        const pool = getPool();

        let query = `
            SELECT 
                c.category_id,
                c.category_name,
                c.description,
                c.parent_id,
                c.image_url,
                c.status,
                c.sort_order,
                p.category_name as parent_name,
                (SELECT COUNT(*) FROM Products WHERE category_id = c.category_id AND status = 'active') as product_count
            FROM Categories c
            LEFT JOIN Categories p ON c.parent_id = p.category_id
        `;

        if (!includeInactive || includeInactive === 'false') {
            query += " WHERE c.status = 'active'";
        }

        query += ' ORDER BY c.sort_order, c.category_name';

        const result = await pool.request().query(query);

        // Xây dựng cấu trúc cây (tree structure)
        const categories = result.recordset;
        const categoryMap = new Map();
        const rootCategories = [];

        // Đầu tiên, tạo map của tất cả categories
        categories.forEach(cat => {
            categoryMap.set(cat.category_id, {
                id: cat.category_id,
                name: cat.category_name,
                description: cat.description,
                parentId: cat.parent_id,
                parentName: cat.parent_name,
                image: cat.image_url,
                status: cat.status,
                sortOrder: cat.sort_order,
                productCount: cat.product_count,
                children: []
            });
        });

        // Sau đó, xây dựng cấu trúc cây
        categories.forEach(cat => {
            const category = categoryMap.get(cat.category_id);
            if (cat.parent_id) {
                const parent = categoryMap.get(cat.parent_id);
                if (parent) {
                    parent.children.push(category);
                }
            } else {
                rootCategories.push(category);
            }
        });

        res.json({
            success: true,
            data: rootCategories
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh mục'
        });
    }
};

// @desc    Lấy danh sách flat (không tree) - dùng cho dropdown
// @route   GET /api/categories/flat
// @access  Public
const getCategoriesFlat = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                category_id,
                category_name,
                parent_id,
                status
            FROM Categories
            WHERE status = 'active'
            ORDER BY sort_order, category_name
        `);

        res.json({
            success: true,
            data: result.recordset.map(c => ({
                id: c.category_id,
                name: c.category_name,
                parentId: c.parent_id
            }))
        });

    } catch (error) {
        console.error('Get categories flat error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy chi tiết danh mục
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('categoryId', sql.Int, id)
            .query(`
                SELECT 
                    c.*,
                    p.category_name as parent_name
                FROM Categories c
                LEFT JOIN Categories p ON c.parent_id = p.category_id
                WHERE c.category_id = @categoryId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        const category = result.recordset[0];

        res.json({
            success: true,
            data: {
                id: category.category_id,
                name: category.category_name,
                description: category.description,
                parentId: category.parent_id,
                parentName: category.parent_name,
                image: category.image_url,
                status: category.status,
                sortOrder: category.sort_order
            }
        });

    } catch (error) {
        console.error('Get category by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Tạo danh mục mới (Admin)
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const { categoryName, description, parentId, sortOrder = 0 } = req.body;
        const pool = getPool();

        // Kiểm tra tên danh mục đã tồn tại chưa
        const existing = await pool.request()
            .input('categoryName', sql.NVarChar, categoryName)
            .query('SELECT category_id FROM Categories WHERE category_name = @categoryName');

        if (existing.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục đã tồn tại'
            });
        }

        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/categories/${req.file.filename}`;
        }

        const result = await pool.request()
            .input('categoryName', sql.NVarChar, categoryName)
            .input('description', sql.NVarChar, description)
            .input('parentId', sql.Int, parentId || null)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .input('sortOrder', sql.Int, sortOrder)
            .query(`
                INSERT INTO Categories (category_name, description, parent_id, image_url, sort_order)
                OUTPUT INSERTED.category_id
                VALUES (@categoryName, @description, @parentId, @imageUrl, @sortOrder)
            `);

        res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            data: {
                categoryId: result.recordset[0].category_id
            }
        });

    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo danh mục'
        });
    }
};

// @desc    Cập nhật danh mục (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryName, description, parentId, sortOrder, status } = req.body;
        const pool = getPool();

        // Kiểm tra danh mục tồn tại
        const existing = await pool.request()
            .input('categoryId', sql.Int, id)
            .query('SELECT category_id, image_url FROM Categories WHERE category_id = @categoryId');

        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        // Kiểm tra không thể đặt parent là chính nó hoặc con của nó
        if (parentId && parseInt(parentId) === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể đặt danh mục cha là chính nó'
            });
        }

        let imageUrl = existing.recordset[0].image_url;
        if (req.file) {
            imageUrl = `/uploads/categories/${req.file.filename}`;
        }

        await pool.request()
            .input('categoryId', sql.Int, id)
            .input('categoryName', sql.NVarChar, categoryName)
            .input('description', sql.NVarChar, description)
            .input('parentId', sql.Int, parentId || null)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .input('sortOrder', sql.Int, sortOrder)
            .input('status', sql.VarChar, status)
            .query(`
                UPDATE Categories
                SET category_name = @categoryName,
                    description = @description,
                    parent_id = @parentId,
                    image_url = @imageUrl,
                    sort_order = @sortOrder,
                    status = @status,
                    updated_at = GETDATE()
                WHERE category_id = @categoryId
            `);

        res.json({
            success: true,
            message: 'Cập nhật danh mục thành công'
        });

    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật danh mục'
        });
    }
};

// @desc    Xóa danh mục (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        // Kiểm tra có sản phẩm nào thuộc danh mục này không
        const productCheck = await pool.request()
            .input('categoryId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Products WHERE category_id = @categoryId');

        if (productCheck.recordset[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa danh mục đang có sản phẩm'
            });
        }

        // Kiểm tra có danh mục con không
        const childCheck = await pool.request()
            .input('categoryId', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Categories WHERE parent_id = @categoryId');

        if (childCheck.recordset[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa danh mục đang có danh mục con'
            });
        }

        await pool.request()
            .input('categoryId', sql.Int, id)
            .query('DELETE FROM Categories WHERE category_id = @categoryId');

        res.json({
            success: true,
            message: 'Xóa danh mục thành công'
        });

    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa danh mục'
        });
    }
};

module.exports = {
    getCategories,
    getCategoriesFlat,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
