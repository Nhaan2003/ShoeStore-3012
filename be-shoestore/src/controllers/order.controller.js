const { getPool, sql } = require('../config/database');

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const {
            shippingName,
            shippingPhone,
            shippingAddress,
            paymentMethod = 'COD',
            promotionCode,
            notes
        } = req.body;

        const pool = getPool();

        // Lấy giỏ hàng của user
        const cartResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT 
                    ci.variant_id,
                    ci.quantity,
                    pv.price as variant_price,
                    pv.stock_quantity,
                    pv.size,
                    pv.color,
                    pv.status as variant_status,
                    p.product_id,
                    p.product_name,
                    p.base_price,
                    p.status as product_status
                FROM Carts c
                JOIN CartItems ci ON c.cart_id = ci.cart_id
                JOIN ProductVariants pv ON ci.variant_id = pv.variant_id
                JOIN Products p ON pv.product_id = p.product_id
                WHERE c.user_id = @userId
            `);

        if (cartResult.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống'
            });
        }

        // Kiểm tra tất cả sản phẩm còn hàng
        for (const item of cartResult.recordset) {
            if (item.product_status !== 'active' || item.variant_status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm "${item.product_name}" hiện không khả dụng`
                });
            }
            if (item.stock_quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm "${item.product_name}" (${item.size}/${item.color}) chỉ còn ${item.stock_quantity} trong kho`
                });
            }
        }

        // Tính tổng tiền
        let totalAmount = 0;
        const orderItems = cartResult.recordset.map(item => {
            const price = item.variant_price || item.base_price;
            const subtotal = price * item.quantity;
            totalAmount += subtotal;
            return {
                variantId: item.variant_id,
                productName: item.product_name,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unitPrice: price,
                subtotal
            };
        });

        // Kiểm tra và áp dụng mã giảm giá
        let discountAmount = 0;
        let shippingFee = totalAmount >= 1000000 ? 0 : 30000; // Miễn phí ship cho đơn từ 1 triệu

        if (promotionCode) {
            const promoResult = await pool.request()
                .input('code', sql.NVarChar, promotionCode)
                .query(`
                    SELECT * FROM Promotions 
                    WHERE code = @code 
                    AND status = 'active' 
                    AND start_date <= GETDATE() 
                    AND end_date >= GETDATE()
                    AND (usage_limit IS NULL OR used_count < usage_limit)
                `);

            if (promoResult.recordset.length > 0) {
                const promo = promoResult.recordset[0];
                
                if (totalAmount >= promo.min_order_amount) {
                    if (promo.discount_type === 'percentage') {
                        discountAmount = totalAmount * promo.discount_value / 100;
                        if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
                            discountAmount = promo.max_discount_amount;
                        }
                    } else if (promo.discount_type === 'fixed_amount') {
                        discountAmount = promo.discount_value;
                    } else if (promo.discount_type === 'free_shipping') {
                        shippingFee = 0;
                    }

                    // Tăng số lần sử dụng
                    await pool.request()
                        .input('promoId', sql.Int, promo.promotion_id)
                        .query('UPDATE Promotions SET used_count = used_count + 1 WHERE promotion_id = @promoId');
                }
            }
        }

        const finalAmount = totalAmount - discountAmount + shippingFee;

        // Tạo mã đơn hàng
        const orderCodeResult = await pool.request()
            .output('OrderCode', sql.NVarChar(20))
            .execute('sp_GenerateOrderCode');
        
        const orderCode = orderCodeResult.output.OrderCode;

        // Tạo đơn hàng
        const orderResult = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('orderCode', sql.NVarChar, orderCode)
            .input('totalAmount', sql.Decimal, totalAmount)
            .input('discountAmount', sql.Decimal, discountAmount)
            .input('shippingFee', sql.Decimal, shippingFee)
            .input('finalAmount', sql.Decimal, finalAmount)
            .input('paymentMethod', sql.VarChar, paymentMethod)
            .input('shippingName', sql.NVarChar, shippingName)
            .input('shippingPhone', sql.NVarChar, shippingPhone)
            .input('shippingAddress', sql.NVarChar, shippingAddress)
            .input('notes', sql.NVarChar, notes)
            .input('promotionCode', sql.NVarChar, promotionCode)
            .query(`
                INSERT INTO Orders (
                    user_id, order_code, total_amount, discount_amount, shipping_fee, 
                    final_amount, payment_method, shipping_name, shipping_phone, 
                    shipping_address, notes, promotion_code
                )
                OUTPUT INSERTED.order_id
                VALUES (
                    @userId, @orderCode, @totalAmount, @discountAmount, @shippingFee,
                    @finalAmount, @paymentMethod, @shippingName, @shippingPhone,
                    @shippingAddress, @notes, @promotionCode
                )
            `);

        const orderId = orderResult.recordset[0].order_id;

        // Tạo order items và giảm số lượng trong kho
        for (const item of orderItems) {
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('variantId', sql.Int, item.variantId)
                .input('productName', sql.NVarChar, item.productName)
                .input('size', sql.NVarChar, item.size)
                .input('color', sql.NVarChar, item.color)
                .input('quantity', sql.Int, item.quantity)
                .input('unitPrice', sql.Decimal, item.unitPrice)
                .input('subtotal', sql.Decimal, item.subtotal)
                .query(`
                    INSERT INTO OrderItems (order_id, variant_id, product_name, size, color, quantity, unit_price, subtotal)
                    VALUES (@orderId, @variantId, @productName, @size, @color, @quantity, @unitPrice, @subtotal)
                `);

            // Giảm số lượng trong kho
            await pool.request()
                .input('variantId', sql.Int, item.variantId)
                .input('quantity', sql.Int, item.quantity)
                .input('orderId', sql.Int, orderId)
                .input('userId', sql.Int, req.user.userId)
                .execute('sp_UpdateStockOnOrder');
        }

        // Xóa giỏ hàng
        await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                DELETE ci FROM CartItems ci
                JOIN Carts c ON ci.cart_id = c.cart_id
                WHERE c.user_id = @userId
            `);

        // Tạo notification
        await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('type', sql.VarChar, 'order')
            .input('title', sql.NVarChar, 'Đặt hàng thành công')
            .input('message', sql.NVarChar, `Đơn hàng ${orderCode} đã được tạo thành công`)
            .input('data', sql.NVarChar, JSON.stringify({ orderId, orderCode }))
            .query(`
                INSERT INTO Notifications (user_id, type, title, message, data)
                VALUES (@userId, @type, @title, @message, @data)
            `);

        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công',
            data: {
                orderId,
                orderCode,
                totalAmount,
                discountAmount,
                shippingFee,
                finalAmount
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo đơn hàng'
        });
    }
};

// @desc    Lấy danh sách đơn hàng của user
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const pool = getPool();
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = 'WHERE o.user_id = @userId';
        if (status) {
            whereClause += ' AND o.status = @status';
        }

        const request = pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, parseInt(limit));

        if (status) {
            request.input('status', sql.VarChar, status);
        }

        const ordersResult = await request.query(`
            SELECT 
                o.order_id,
                o.order_code,
                o.total_amount,
                o.discount_amount,
                o.shipping_fee,
                o.final_amount,
                o.status,
                o.payment_method,
                o.payment_status,
                o.created_at,
                (SELECT COUNT(*) FROM OrderItems WHERE order_id = o.order_id) as item_count,
                (SELECT TOP 1 
                    (SELECT TOP 1 image_url FROM ProductImages pi 
                     JOIN ProductVariants pv ON pi.product_id = pv.product_id 
                     WHERE pv.variant_id = oi.variant_id AND pi.is_primary = 1)
                 FROM OrderItems oi WHERE oi.order_id = o.order_id) as first_item_image
            FROM Orders o
            ${whereClause}
            ORDER BY o.created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        // Đếm tổng
        const countRequest = pool.request().input('userId', sql.Int, req.user.userId);
        if (status) countRequest.input('status', sql.VarChar, status);
        
        const countResult = await countRequest.query(`
            SELECT COUNT(*) as total FROM Orders o ${whereClause}
        `);

        const total = countResult.recordset[0].total;

        res.json({
            success: true,
            data: {
                orders: ordersResult.recordset.map(o => ({
                    id: o.order_id,
                    orderCode: o.order_code,
                    totalAmount: o.total_amount,
                    discountAmount: o.discount_amount,
                    shippingFee: o.shipping_fee,
                    finalAmount: o.final_amount,
                    status: o.status,
                    paymentMethod: o.payment_method,
                    paymentStatus: o.payment_status,
                    itemCount: o.item_count,
                    firstItemImage: o.first_item_image,
                    createdAt: o.created_at
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
        console.error('Get my orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách đơn hàng'
        });
    }
};

// @desc    Lấy chi tiết đơn hàng
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const orderResult = await pool.request()
            .input('orderId', sql.Int, id)
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT o.*, u.full_name as customer_name, u.email as customer_email
                FROM Orders o
                JOIN Users u ON o.user_id = u.user_id
                WHERE o.order_id = @orderId 
                AND (o.user_id = @userId OR @userId IN (SELECT user_id FROM Users WHERE role IN ('admin', 'staff')))
            `);

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const order = orderResult.recordset[0];

        // Lấy order items
        const itemsResult = await pool.request()
            .input('orderId', sql.Int, id)
            .query(`
                SELECT 
                    oi.*,
                    (SELECT TOP 1 image_url FROM ProductImages pi 
                     JOIN ProductVariants pv ON pi.product_id = pv.product_id 
                     WHERE pv.variant_id = oi.variant_id AND pi.is_primary = 1) as image
                FROM OrderItems oi
                WHERE oi.order_id = @orderId
            `);

        res.json({
            success: true,
            data: {
                id: order.order_id,
                orderCode: order.order_code,
                customer: {
                    name: order.customer_name,
                    email: order.customer_email
                },
                shipping: {
                    name: order.shipping_name,
                    phone: order.shipping_phone,
                    address: order.shipping_address
                },
                totalAmount: order.total_amount,
                discountAmount: order.discount_amount,
                shippingFee: order.shipping_fee,
                finalAmount: order.final_amount,
                status: order.status,
                paymentMethod: order.payment_method,
                paymentStatus: order.payment_status,
                promotionCode: order.promotion_code,
                notes: order.notes,
                cancelReason: order.cancel_reason,
                confirmedAt: order.confirmed_at,
                shippedAt: order.shipped_at,
                deliveredAt: order.delivered_at,
                cancelledAt: order.cancelled_at,
                createdAt: order.created_at,
                items: itemsResult.recordset.map(i => ({
                    id: i.order_item_id,
                    variantId: i.variant_id,
                    productName: i.product_name,
                    size: i.size,
                    color: i.color,
                    quantity: i.quantity,
                    unitPrice: i.unit_price,
                    subtotal: i.subtotal,
                    image: i.image
                }))
            }
        });

    } catch (error) {
        console.error('Get order by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Hủy đơn hàng (User)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const pool = getPool();

        // Kiểm tra đơn hàng
        const orderResult = await pool.request()
            .input('orderId', sql.Int, id)
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT order_id, status FROM Orders 
                WHERE order_id = @orderId AND user_id = @userId
            `);

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const order = orderResult.recordset[0];

        // Chỉ cho phép hủy đơn hàng pending hoặc confirmed
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy đơn hàng ở trạng thái này'
            });
        }

        // Cập nhật trạng thái và hoàn lại số lượng kho
        await pool.request()
            .input('orderId', sql.Int, id)
            .input('reason', sql.NVarChar, reason)
            .query(`
                UPDATE Orders 
                SET status = 'cancelled', 
                    cancel_reason = @reason,
                    cancelled_at = GETDATE(),
                    updated_at = GETDATE()
                WHERE order_id = @orderId
            `);

        // Hoàn lại số lượng kho
        await pool.request()
            .input('orderId', sql.Int, id)
            .input('userId', sql.Int, req.user.userId)
            .execute('sp_RestoreStockOnCancel');

        res.json({
            success: true,
            message: 'Hủy đơn hàng thành công'
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi hủy đơn hàng'
        });
    }
};

// @desc    Lấy tất cả đơn hàng (Admin/Staff)
// @route   GET /api/orders/admin/all
// @access  Private/Admin/Staff
const getAllOrders = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            search,
            startDate,
            endDate,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const pool = getPool();
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = ['1=1'];
        const request = pool.request();

        if (status) {
            whereConditions.push('o.status = @status');
            request.input('status', sql.VarChar, status);
        }

        if (search) {
            whereConditions.push('(o.order_code LIKE @search OR o.shipping_name LIKE @search OR o.shipping_phone LIKE @search)');
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        if (startDate) {
            whereConditions.push('o.created_at >= @startDate');
            request.input('startDate', sql.DateTime, new Date(startDate));
        }

        if (endDate) {
            whereConditions.push('o.created_at <= @endDate');
            request.input('endDate', sql.DateTime, new Date(endDate));
        }

        const whereClause = whereConditions.join(' AND ');

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const ordersResult = await request.query(`
            SELECT 
                o.*,
                u.full_name as customer_name,
                u.email as customer_email,
                u.phone as customer_phone,
                (SELECT COUNT(*) FROM OrderItems WHERE order_id = o.order_id) as item_count,
                staff.full_name as processed_by_name
            FROM Orders o
            JOIN Users u ON o.user_id = u.user_id
            LEFT JOIN Users staff ON o.processed_by = staff.user_id
            WHERE ${whereClause}
            ORDER BY o.${sortBy} ${sortOrder}
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        // Đếm tổng
        const countRequest = pool.request();
        if (status) countRequest.input('status', sql.VarChar, status);
        if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);
        if (startDate) countRequest.input('startDate', sql.DateTime, new Date(startDate));
        if (endDate) countRequest.input('endDate', sql.DateTime, new Date(endDate));

        const countResult = await countRequest.query(`
            SELECT COUNT(*) as total FROM Orders o WHERE ${whereClause}
        `);

        const total = countResult.recordset[0].total;

        res.json({
            success: true,
            data: {
                orders: ordersResult.recordset.map(o => ({
                    id: o.order_id,
                    orderCode: o.order_code,
                    customer: {
                        id: o.user_id,
                        name: o.customer_name,
                        email: o.customer_email,
                        phone: o.customer_phone
                    },
                    shipping: {
                        name: o.shipping_name,
                        phone: o.shipping_phone,
                        address: o.shipping_address
                    },
                    totalAmount: o.total_amount,
                    discountAmount: o.discount_amount,
                    shippingFee: o.shipping_fee,
                    finalAmount: o.final_amount,
                    status: o.status,
                    paymentMethod: o.payment_method,
                    paymentStatus: o.payment_status,
                    itemCount: o.item_count,
                    processedBy: o.processed_by_name,
                    createdAt: o.created_at
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
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Cập nhật trạng thái đơn hàng (Admin/Staff)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Staff
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;
        const pool = getPool();

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Kiểm tra đơn hàng
        const orderResult = await pool.request()
            .input('orderId', sql.Int, id)
            .query('SELECT order_id, status, user_id FROM Orders WHERE order_id = @orderId');

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const order = orderResult.recordset[0];

        // Kiểm tra logic chuyển trạng thái
        const statusFlow = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'returned'],
            'delivered': ['returned'],
            'cancelled': [],
            'returned': []
        };

        if (!statusFlow[order.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Không thể chuyển từ trạng thái "${order.status}" sang "${status}"`
            });
        }

        // Xử lý các trường hợp đặc biệt
        let additionalFields = '';
        if (status === 'confirmed') {
            additionalFields = ', confirmed_at = GETDATE()';
        } else if (status === 'shipped') {
            additionalFields = ', shipped_at = GETDATE()';
        } else if (status === 'delivered') {
            additionalFields = ', delivered_at = GETDATE(), payment_status = \'completed\'';
        } else if (status === 'cancelled') {
            additionalFields = `, cancelled_at = GETDATE(), cancel_reason = '${note || 'Hủy bởi admin'}'`;
            
            // Hoàn lại số lượng kho
            await pool.request()
                .input('orderId', sql.Int, id)
                .input('userId', sql.Int, req.user.userId)
                .execute('sp_RestoreStockOnCancel');
        }

        await pool.request()
            .input('orderId', sql.Int, id)
            .input('status', sql.VarChar, status)
            .input('processedBy', sql.Int, req.user.userId)
            .query(`
                UPDATE Orders 
                SET status = @status, 
                    processed_by = @processedBy,
                    updated_at = GETDATE()
                    ${additionalFields}
                WHERE order_id = @orderId
            `);

        // Tạo notification cho user
        const statusMessages = {
            'confirmed': 'Đơn hàng của bạn đã được xác nhận',
            'processing': 'Đơn hàng của bạn đang được xử lý',
            'shipped': 'Đơn hàng của bạn đang được giao',
            'delivered': 'Đơn hàng của bạn đã được giao thành công',
            'cancelled': 'Đơn hàng của bạn đã bị hủy',
            'returned': 'Đơn hàng của bạn đã được hoàn trả'
        };

        await pool.request()
            .input('userId', sql.Int, order.user_id)
            .input('type', sql.VarChar, 'order')
            .input('title', sql.NVarChar, 'Cập nhật đơn hàng')
            .input('message', sql.NVarChar, statusMessages[status])
            .input('data', sql.NVarChar, JSON.stringify({ orderId: id }))
            .query(`
                INSERT INTO Notifications (user_id, type, title, message, data)
                VALUES (@userId, @type, @title, @message, @data)
            `);

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công'
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái'
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
};
