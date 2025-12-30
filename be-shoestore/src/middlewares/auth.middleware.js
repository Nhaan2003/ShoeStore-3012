const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

// Middleware xác thực token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kiểm tra user có tồn tại và đang active không
        const pool = getPool();
        const result = await pool.request()
            .input('userId', sql.Int, decoded.userId)
            .query('SELECT user_id, email, full_name, role, status FROM Users WHERE user_id = @userId');

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const user = result.recordset[0];

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
            });
        }

        req.user = {
            userId: user.user_id,
            email: user.email,
            fullName: user.full_name,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực'
        });
    }
};

// Middleware kiểm tra optional token (cho guest có thể xem, user đăng nhập có thêm tính năng)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const pool = getPool();
        const result = await pool.request()
            .input('userId', sql.Int, decoded.userId)
            .query('SELECT user_id, email, full_name, role, status FROM Users WHERE user_id = @userId AND status = \'active\'');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            req.user = {
                userId: user.user_id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

// Middleware kiểm tra role Admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Chỉ Admin mới có quyền truy cập'
        });
    }
};

// Middleware kiểm tra role Staff hoặc Admin
const isStaffOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập chức năng này'
        });
    }
};

// Middleware kiểm tra role Customer
const isCustomer = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Chỉ khách hàng mới có quyền thực hiện'
        });
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    isAdmin,
    isStaffOrAdmin,
    isCustomer
};
