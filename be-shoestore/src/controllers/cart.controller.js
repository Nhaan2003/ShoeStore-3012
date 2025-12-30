const { getPool, sql } = require('../config/database');

// @desc    Lấy giỏ hàng của user
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const pool = getPool();

        // Lấy cart_id của user
        const cartResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT cart_id FROM Carts WHERE user_id = @userId');

        if (cartResult.recordset.length === 0) {
            // Tạo giỏ hàng mới nếu chưa có
            const newCart = await pool.request()
                .input('userId', sql.Int, req.user.userId)
                .query(`
                    INSERT INTO Carts (user_id)
                    OUTPUT INSERTED.cart_id
                    VALUES (@userId)
                `);
            
            return res.json({
                success: true,
                data: {
                    cartId: newCart.recordset[0].cart_id,
                    items: [],
                    totalItems: 0,
                    totalAmount: 0
                }
            });
        }

        const cartId = cartResult.recordset[0].cart_id;

        // Lấy các items trong giỏ hàng
        const itemsResult = await pool.request()
            .input('cartId', sql.Int, cartId)
            .query(`
                SELECT 
                    ci.cart_item_id,
                    ci.quantity,
                    ci.added_at,
                    pv.variant_id,
                    pv.size,
                    pv.color,
                    pv.color_code,
                    pv.price as variant_price,
                    pv.stock_quantity,
                    p.product_id,
                    p.product_name,
                    p.base_price,
                    p.status as product_status,
                    pv.status as variant_status,
                    (SELECT TOP 1 image_url FROM ProductImages WHERE product_id = p.product_id AND is_primary = 1) as image
                FROM CartItems ci
                JOIN ProductVariants pv ON ci.variant_id = pv.variant_id
                JOIN Products p ON pv.product_id = p.product_id
                WHERE ci.cart_id = @cartId
                ORDER BY ci.added_at DESC
            `);

        const items = itemsResult.recordset.map(item => {
            const price = item.variant_price || item.base_price;
            return {
                cartItemId: item.cart_item_id,
                product: {
                    id: item.product_id,
                    name: item.product_name,
                    image: item.image
                },
                variant: {
                    id: item.variant_id,
                    size: item.size,
                    color: item.color,
                    colorCode: item.color_code
                },
                price: price,
                quantity: item.quantity,
                subtotal: price * item.quantity,
                stock: item.stock_quantity,
                isAvailable: item.product_status === 'active' && 
                            item.variant_status === 'active' && 
                            item.stock_quantity >= item.quantity,
                addedAt: item.added_at
            };
        });

        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

        res.json({
            success: true,
            data: {
                cartId,
                items,
                totalItems,
                totalAmount
            }
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy giỏ hàng'
        });
    }
};

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/cart/items
// @access  Private
const addToCart = async (req, res) => {
    try {
        const { variantId, quantity = 1 } = req.body;
        const pool = getPool();

        // Kiểm tra variant tồn tại và còn hàng
        const variantResult = await pool.request()
            .input('variantId', sql.Int, variantId)
            .query(`
                SELECT 
                    pv.variant_id,
                    pv.stock_quantity,
                    pv.status as variant_status,
                    p.status as product_status,
                    p.product_name
                FROM ProductVariants pv
                JOIN Products p ON pv.product_id = p.product_id
                WHERE pv.variant_id = @variantId
            `);

        if (variantResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        const variant = variantResult.recordset[0];

        if (variant.product_status !== 'active' || variant.variant_status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Sản phẩm hiện không khả dụng'
            });
        }

        if (variant.stock_quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Chỉ còn ${variant.stock_quantity} sản phẩm trong kho`
            });
        }

        // Lấy hoặc tạo giỏ hàng
        let cartResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT cart_id FROM Carts WHERE user_id = @userId');

        let cartId;
        if (cartResult.recordset.length === 0) {
            const newCart = await pool.request()
                .input('userId', sql.Int, req.user.userId)
                .query(`
                    INSERT INTO Carts (user_id)
                    OUTPUT INSERTED.cart_id
                    VALUES (@userId)
                `);
            cartId = newCart.recordset[0].cart_id;
        } else {
            cartId = cartResult.recordset[0].cart_id;
        }

        // Kiểm tra item đã có trong giỏ hàng chưa
        const existingItem = await pool.request()
            .input('cartId', sql.Int, cartId)
            .input('variantId', sql.Int, variantId)
            .query('SELECT cart_item_id, quantity FROM CartItems WHERE cart_id = @cartId AND variant_id = @variantId');

        if (existingItem.recordset.length > 0) {
            // Cập nhật số lượng
            const newQuantity = existingItem.recordset[0].quantity + quantity;
            
            if (newQuantity > variant.stock_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Không thể thêm. Chỉ còn ${variant.stock_quantity} sản phẩm trong kho`
                });
            }

            await pool.request()
                .input('cartItemId', sql.Int, existingItem.recordset[0].cart_item_id)
                .input('quantity', sql.Int, newQuantity)
                .query('UPDATE CartItems SET quantity = @quantity WHERE cart_item_id = @cartItemId');

            return res.json({
                success: true,
                message: 'Cập nhật giỏ hàng thành công'
            });
        }

        // Thêm item mới
        await pool.request()
            .input('cartId', sql.Int, cartId)
            .input('variantId', sql.Int, variantId)
            .input('quantity', sql.Int, quantity)
            .query(`
                INSERT INTO CartItems (cart_id, variant_id, quantity)
                VALUES (@cartId, @variantId, @quantity)
            `);

        res.status(201).json({
            success: true,
            message: 'Thêm vào giỏ hàng thành công'
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm vào giỏ hàng'
        });
    }
};

// @desc    Cập nhật số lượng item trong giỏ hàng
// @route   PUT /api/cart/items/:itemId
// @access  Private
const updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const pool = getPool();

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải lớn hơn 0'
            });
        }

        // Kiểm tra item thuộc về user
        const itemResult = await pool.request()
            .input('cartItemId', sql.Int, itemId)
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT ci.cart_item_id, ci.variant_id, pv.stock_quantity
                FROM CartItems ci
                JOIN Carts c ON ci.cart_id = c.cart_id
                JOIN ProductVariants pv ON ci.variant_id = pv.variant_id
                WHERE ci.cart_item_id = @cartItemId AND c.user_id = @userId
            `);

        if (itemResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }

        const item = itemResult.recordset[0];

        if (quantity > item.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Chỉ còn ${item.stock_quantity} sản phẩm trong kho`
            });
        }

        await pool.request()
            .input('cartItemId', sql.Int, itemId)
            .input('quantity', sql.Int, quantity)
            .query('UPDATE CartItems SET quantity = @quantity WHERE cart_item_id = @cartItemId');

        res.json({
            success: true,
            message: 'Cập nhật số lượng thành công'
        });

    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật giỏ hàng'
        });
    }
};

// @desc    Xóa item khỏi giỏ hàng
// @route   DELETE /api/cart/items/:itemId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const pool = getPool();

        // Kiểm tra item thuộc về user
        const itemResult = await pool.request()
            .input('cartItemId', sql.Int, itemId)
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT ci.cart_item_id
                FROM CartItems ci
                JOIN Carts c ON ci.cart_id = c.cart_id
                WHERE ci.cart_item_id = @cartItemId AND c.user_id = @userId
            `);

        if (itemResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }

        await pool.request()
            .input('cartItemId', sql.Int, itemId)
            .query('DELETE FROM CartItems WHERE cart_item_id = @cartItemId');

        res.json({
            success: true,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng'
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa khỏi giỏ hàng'
        });
    }
};

// @desc    Xóa toàn bộ giỏ hàng
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
    try {
        const pool = getPool();

        const cartResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT cart_id FROM Carts WHERE user_id = @userId');

        if (cartResult.recordset.length > 0) {
            await pool.request()
                .input('cartId', sql.Int, cartResult.recordset[0].cart_id)
                .query('DELETE FROM CartItems WHERE cart_id = @cartId');
        }

        res.json({
            success: true,
            message: 'Đã xóa toàn bộ giỏ hàng'
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa giỏ hàng'
        });
    }
};

// @desc    Lấy số lượng items trong giỏ hàng
// @route   GET /api/cart/count
// @access  Private
const getCartCount = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT ISNULL(SUM(ci.quantity), 0) as total_items
                FROM CartItems ci
                JOIN Carts c ON ci.cart_id = c.cart_id
                WHERE c.user_id = @userId
            `);

        res.json({
            success: true,
            data: {
                count: result.recordset[0].total_items
            }
        });

    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount
};
