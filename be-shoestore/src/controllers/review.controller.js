const { getPool, sql } = require('../config/database');

// @desc    Lấy danh sách đánh giá của sản phẩm
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, rating } = req.query;
        const pool = getPool();
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = ['r.product_id = @productId', "r.status = 'approved'"];
        const request = pool.request()
            .input('productId', sql.Int, productId)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, parseInt(limit));

        if (rating) {
            whereConditions.push('r.rating = @rating');
            request.input('rating', sql.Int, rating);
        }

        const whereClause = whereConditions.join(' AND ');

        const reviewsResult = await request.query(`
            SELECT 
                r.review_id,
                r.rating,
                r.title,
                r.comment,
                r.images,
                r.admin_reply,
                r.replied_at,
                r.created_at,
                u.full_name,
                u.avatar,
                pv.size,
                pv.color
            FROM Reviews r
            JOIN Users u ON r.user_id = u.user_id
            LEFT JOIN Orders o ON r.order_id = o.order_id
            LEFT JOIN OrderItems oi ON o.order_id = oi.order_id
            LEFT JOIN ProductVariants pv ON oi.variant_id = pv.variant_id AND pv.product_id = r.product_id
            WHERE ${whereClause}
            ORDER BY r.created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        // Đếm tổng
        const countRequest = pool.request().input('productId', sql.Int, productId);
        if (rating) countRequest.input('rating', sql.Int, rating);
        
        const countResult = await countRequest.query(`
            SELECT COUNT(*) as total FROM Reviews r WHERE ${whereClause}
        `);

        const total = countResult.recordset[0].total;

        res.json({
            success: true,
            data: {
                reviews: reviewsResult.recordset.map(r => ({
                    id: r.review_id,
                    rating: r.rating,
                    title: r.title,
                    comment: r.comment,
                    images: r.images ? JSON.parse(r.images) : [],
                    adminReply: r.admin_reply,
                    repliedAt: r.replied_at,
                    createdAt: r.created_at,
                    user: {
                        name: r.full_name,
                        avatar: r.avatar
                    },
                    variant: r.size ? {
                        size: r.size,
                        color: r.color
                    } : null
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
        console.error('Get product reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Tạo đánh giá mới
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        const { productId, orderId, rating, title, comment } = req.body;
        const pool = getPool();

        // Kiểm tra user đã mua sản phẩm này chưa
        const orderCheck = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('productId', sql.Int, productId)
            .input('orderId', sql.Int, orderId)
            .query(`
                SELECT o.order_id
                FROM Orders o
                JOIN OrderItems oi ON o.order_id = oi.order_id
                JOIN ProductVariants pv ON oi.variant_id = pv.variant_id
                WHERE o.user_id = @userId 
                AND o.order_id = @orderId
                AND pv.product_id = @productId
                AND o.status = 'delivered'
            `);

        if (orderCheck.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa mua sản phẩm này hoặc đơn hàng chưa hoàn thành'
            });
        }

        // Kiểm tra đã đánh giá chưa
        const existingReview = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('productId', sql.Int, productId)
            .input('orderId', sql.Int, orderId)
            .query(`
                SELECT review_id FROM Reviews 
                WHERE user_id = @userId AND product_id = @productId AND order_id = @orderId
            `);

        if (existingReview.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi'
            });
        }

        // Upload ảnh nếu có
        let images = null;
        if (req.files && req.files.length > 0) {
            images = JSON.stringify(req.files.map(f => `/uploads/reviews/${f.filename}`));
        }

        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('productId', sql.Int, productId)
            .input('orderId', sql.Int, orderId)
            .input('rating', sql.Int, rating)
            .input('title', sql.NVarChar, title)
            .input('comment', sql.NVarChar, comment)
            .input('images', sql.NVarChar, images)
            .query(`
                INSERT INTO Reviews (user_id, product_id, order_id, rating, title, comment, images)
                OUTPUT INSERTED.review_id
                VALUES (@userId, @productId, @orderId, @rating, @title, @comment, @images)
            `);

        res.status(201).json({
            success: true,
            message: 'Đánh giá của bạn đã được gửi và đang chờ duyệt',
            data: {
                reviewId: result.recordset[0].review_id
            }
        });

    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo đánh giá'
        });
    }
};

// @desc    Lấy danh sách sản phẩm có thể đánh giá
// @route   GET /api/reviews/reviewable
// @access  Private
const getReviewableProducts = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT DISTINCT
                    p.product_id,
                    p.product_name,
                    o.order_id,
                    o.order_code,
                    oi.size,
                    oi.color,
                    o.delivered_at,
                    (SELECT TOP 1 image_url FROM ProductImages WHERE product_id = p.product_id AND is_primary = 1) as image
                FROM Orders o
                JOIN OrderItems oi ON o.order_id = oi.order_id
                JOIN ProductVariants pv ON oi.variant_id = pv.variant_id
                JOIN Products p ON pv.product_id = p.product_id
                WHERE o.user_id = @userId 
                AND o.status = 'delivered'
                AND NOT EXISTS (
                    SELECT 1 FROM Reviews r 
                    WHERE r.user_id = @userId 
                    AND r.product_id = p.product_id 
                    AND r.order_id = o.order_id
                )
                ORDER BY o.delivered_at DESC
            `);

        res.json({
            success: true,
            data: result.recordset.map(r => ({
                product: {
                    id: r.product_id,
                    name: r.product_name,
                    image: r.image
                },
                order: {
                    id: r.order_id,
                    code: r.order_code
                },
                variant: {
                    size: r.size,
                    color: r.color
                },
                deliveredAt: r.delivered_at
            }))
        });

    } catch (error) {
        console.error('Get reviewable products error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy tất cả đánh giá (Admin)
// @route   GET /api/reviews/admin
// @access  Private/Admin
const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, rating } = req.query;
        const pool = getPool();
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = ['1=1'];
        const request = pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, parseInt(limit));

        if (status) {
            whereConditions.push('r.status = @status');
            request.input('status', sql.VarChar, status);
        }

        if (rating) {
            whereConditions.push('r.rating = @rating');
            request.input('rating', sql.Int, rating);
        }

        const whereClause = whereConditions.join(' AND ');

        const reviewsResult = await request.query(`
            SELECT 
                r.*,
                u.full_name,
                u.email,
                p.product_name,
                (SELECT TOP 1 image_url FROM ProductImages WHERE product_id = p.product_id AND is_primary = 1) as product_image
            FROM Reviews r
            JOIN Users u ON r.user_id = u.user_id
            JOIN Products p ON r.product_id = p.product_id
            WHERE ${whereClause}
            ORDER BY r.created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        const countRequest = pool.request();
        if (status) countRequest.input('status', sql.VarChar, status);
        if (rating) countRequest.input('rating', sql.Int, rating);

        const countResult = await countRequest.query(`
            SELECT COUNT(*) as total FROM Reviews r WHERE ${whereClause}
        `);

        const total = countResult.recordset[0].total;

        res.json({
            success: true,
            data: {
                reviews: reviewsResult.recordset.map(r => ({
                    id: r.review_id,
                    rating: r.rating,
                    title: r.title,
                    comment: r.comment,
                    images: r.images ? JSON.parse(r.images) : [],
                    status: r.status,
                    adminReply: r.admin_reply,
                    repliedAt: r.replied_at,
                    createdAt: r.created_at,
                    user: {
                        id: r.user_id,
                        name: r.full_name,
                        email: r.email
                    },
                    product: {
                        id: r.product_id,
                        name: r.product_name,
                        image: r.product_image
                    }
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
        console.error('Get all reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Duyệt/Từ chối đánh giá (Admin)
// @route   PUT /api/reviews/:id/status
// @access  Private/Admin
const updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const pool = getPool();

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        await pool.request()
            .input('reviewId', sql.Int, id)
            .input('status', sql.VarChar, status)
            .query('UPDATE Reviews SET status = @status, updated_at = GETDATE() WHERE review_id = @reviewId');

        res.json({
            success: true,
            message: status === 'approved' ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá'
        });

    } catch (error) {
        console.error('Update review status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Trả lời đánh giá (Admin)
// @route   PUT /api/reviews/:id/reply
// @access  Private/Admin
const replyReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const pool = getPool();

        await pool.request()
            .input('reviewId', sql.Int, id)
            .input('reply', sql.NVarChar, reply)
            .input('repliedBy', sql.Int, req.user.userId)
            .query(`
                UPDATE Reviews 
                SET admin_reply = @reply, 
                    replied_at = GETDATE(), 
                    replied_by = @repliedBy,
                    updated_at = GETDATE()
                WHERE review_id = @reviewId
            `);

        res.json({
            success: true,
            message: 'Đã gửi phản hồi'
        });

    } catch (error) {
        console.error('Reply review error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    getProductReviews,
    createReview,
    getReviewableProducts,
    getAllReviews,
    updateReviewStatus,
    replyReview
};
