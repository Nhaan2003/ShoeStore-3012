const { getPool, sql } = require('../config/database');

// @desc    Lấy danh sách khuyến mãi đang hoạt động (Public)
// @route   GET /api/promotions
// @access  Public
const getActivePromotions = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                promotion_id,
                code,
                name,
                description,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount_amount,
                start_date,
                end_date
            FROM Promotions
            WHERE status = 'active' 
            AND start_date <= GETDATE() 
            AND end_date >= GETDATE()
            AND (usage_limit IS NULL OR used_count < usage_limit)
            ORDER BY discount_value DESC
        `);

        res.json({
            success: true,
            data: result.recordset.map(p => ({
                id: p.promotion_id,
                code: p.code,
                name: p.name,
                description: p.description,
                discountType: p.discount_type,
                discountValue: p.discount_value,
                minOrderAmount: p.min_order_amount,
                maxDiscountAmount: p.max_discount_amount,
                startDate: p.start_date,
                endDate: p.end_date
            }))
        });

    } catch (error) {
        console.error('Get active promotions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Kiểm tra mã khuyến mãi
// @route   POST /api/promotions/verify
// @access  Private
const verifyPromotion = async (req, res) => {
    try {
        const { code, orderAmount } = req.body;
        const pool = getPool();

        const result = await pool.request()
            .input('code', sql.NVarChar, code)
            .query(`
                SELECT *
                FROM Promotions
                WHERE code = @code 
                AND status = 'active' 
                AND start_date <= GETDATE() 
                AND end_date >= GETDATE()
                AND (usage_limit IS NULL OR used_count < usage_limit)
            `);

        if (result.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn'
            });
        }

        const promo = result.recordset[0];

        if (orderAmount < promo.min_order_amount) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng tối thiểu ${promo.min_order_amount.toLocaleString()}đ để sử dụng mã này`
            });
        }

        let discountAmount = 0;
        if (promo.discount_type === 'percentage') {
            discountAmount = orderAmount * promo.discount_value / 100;
            if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
                discountAmount = promo.max_discount_amount;
            }
        } else if (promo.discount_type === 'fixed_amount') {
            discountAmount = promo.discount_value;
        }

        res.json({
            success: true,
            data: {
                code: promo.code,
                name: promo.name,
                discountType: promo.discount_type,
                discountValue: promo.discount_value,
                discountAmount: discountAmount,
                isFreeShipping: promo.discount_type === 'free_shipping'
            }
        });

    } catch (error) {
        console.error('Verify promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy tất cả khuyến mãi (Admin)
// @route   GET /api/promotions/admin
// @access  Private/Admin
const getAllPromotions = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const pool = getPool();
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = ['1=1'];
        const request = pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, parseInt(limit));

        if (status) {
            whereConditions.push('status = @status');
            request.input('status', sql.VarChar, status);
        }

        const whereClause = whereConditions.join(' AND ');

        const promotionsResult = await request.query(`
            SELECT *
            FROM Promotions
            WHERE ${whereClause}
            ORDER BY created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        const countRequest = pool.request();
        if (status) countRequest.input('status', sql.VarChar, status);

        const countResult = await countRequest.query(`
            SELECT COUNT(*) as total FROM Promotions WHERE ${whereClause}
        `);

        const total = countResult.recordset[0].total;

        res.json({
            success: true,
            data: {
                promotions: promotionsResult.recordset.map(p => ({
                    id: p.promotion_id,
                    code: p.code,
                    name: p.name,
                    description: p.description,
                    discountType: p.discount_type,
                    discountValue: p.discount_value,
                    minOrderAmount: p.min_order_amount,
                    maxDiscountAmount: p.max_discount_amount,
                    usageLimit: p.usage_limit,
                    usedCount: p.used_count,
                    startDate: p.start_date,
                    endDate: p.end_date,
                    status: p.status,
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
        console.error('Get all promotions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Tạo khuyến mãi mới (Admin)
// @route   POST /api/promotions
// @access  Private/Admin
const createPromotion = async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            discountType,
            discountValue,
            minOrderAmount = 0,
            maxDiscountAmount,
            usageLimit,
            startDate,
            endDate
        } = req.body;

        const pool = getPool();

        // Kiểm tra code đã tồn tại chưa
        const existing = await pool.request()
            .input('code', sql.NVarChar, code.toUpperCase())
            .query('SELECT promotion_id FROM Promotions WHERE code = @code');

        if (existing.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Mã khuyến mãi đã tồn tại'
            });
        }

        const result = await pool.request()
            .input('code', sql.NVarChar, code.toUpperCase())
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('discountType', sql.VarChar, discountType)
            .input('discountValue', sql.Decimal, discountValue)
            .input('minOrderAmount', sql.Decimal, minOrderAmount)
            .input('maxDiscountAmount', sql.Decimal, maxDiscountAmount || null)
            .input('usageLimit', sql.Int, usageLimit || null)
            .input('startDate', sql.DateTime, new Date(startDate))
            .input('endDate', sql.DateTime, new Date(endDate))
            .input('createdBy', sql.Int, req.user.userId)
            .query(`
                INSERT INTO Promotions (
                    code, name, description, discount_type, discount_value,
                    min_order_amount, max_discount_amount, usage_limit,
                    start_date, end_date, created_by
                )
                OUTPUT INSERTED.promotion_id
                VALUES (
                    @code, @name, @description, @discountType, @discountValue,
                    @minOrderAmount, @maxDiscountAmount, @usageLimit,
                    @startDate, @endDate, @createdBy
                )
            `);

        res.status(201).json({
            success: true,
            message: 'Tạo khuyến mãi thành công',
            data: {
                promotionId: result.recordset[0].promotion_id
            }
        });

    } catch (error) {
        console.error('Create promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo khuyến mãi'
        });
    }
};

// @desc    Cập nhật khuyến mãi (Admin)
// @route   PUT /api/promotions/:id
// @access  Private/Admin
const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            usageLimit,
            startDate,
            endDate,
            status
        } = req.body;

        const pool = getPool();

        await pool.request()
            .input('promotionId', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('discountType', sql.VarChar, discountType)
            .input('discountValue', sql.Decimal, discountValue)
            .input('minOrderAmount', sql.Decimal, minOrderAmount)
            .input('maxDiscountAmount', sql.Decimal, maxDiscountAmount || null)
            .input('usageLimit', sql.Int, usageLimit || null)
            .input('startDate', sql.DateTime, new Date(startDate))
            .input('endDate', sql.DateTime, new Date(endDate))
            .input('status', sql.VarChar, status)
            .query(`
                UPDATE Promotions
                SET name = @name,
                    description = @description,
                    discount_type = @discountType,
                    discount_value = @discountValue,
                    min_order_amount = @minOrderAmount,
                    max_discount_amount = @maxDiscountAmount,
                    usage_limit = @usageLimit,
                    start_date = @startDate,
                    end_date = @endDate,
                    status = @status,
                    updated_at = GETDATE()
                WHERE promotion_id = @promotionId
            `);

        res.json({
            success: true,
            message: 'Cập nhật khuyến mãi thành công'
        });

    } catch (error) {
        console.error('Update promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Xóa khuyến mãi (Admin)
// @route   DELETE /api/promotions/:id
// @access  Private/Admin
const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const promoResult = await pool.request()
            .input('promotionId', sql.Int, id)
            .query('SELECT used_count FROM Promotions WHERE promotion_id = @promotionId');

        if (promoResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khuyến mãi'
            });
        }

        if (promoResult.recordset[0].used_count > 0) {
            await pool.request()
                .input('promotionId', sql.Int, id)
                .query("UPDATE Promotions SET status = 'inactive' WHERE promotion_id = @promotionId");
            
            return res.json({
                success: true,
                message: 'Đã vô hiệu hóa khuyến mãi'
            });
        }

        await pool.request()
            .input('promotionId', sql.Int, id)
            .query('DELETE FROM Promotions WHERE promotion_id = @promotionId');

        res.json({
            success: true,
            message: 'Xóa khuyến mãi thành công'
        });

    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    getActivePromotions,
    verifyPromotion,
    getAllPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
};
