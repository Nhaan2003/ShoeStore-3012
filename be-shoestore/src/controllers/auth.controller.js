const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');

// Tạo JWT Token
const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    const refreshToken = jwt.sign(
        { userId, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    return { accessToken, refreshToken };
};

// @desc    Đăng ký tài khoản khách hàng
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;

        const pool = getPool();

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT user_id FROM Users WHERE email = @email');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.NVarChar, phone || null)
            .input('role', sql.VarChar, 'customer')
            .input('status', sql.VarChar, 'active')
            .query(`
                INSERT INTO Users (email, password_hash, full_name, phone, role, status)
                OUTPUT INSERTED.user_id, INSERTED.email, INSERTED.full_name, INSERTED.role
                VALUES (@email, @password, @fullName, @phone, @role, @status)
            `);

        const newUser = result.recordset[0];

        // Tạo giỏ hàng cho user
        await pool.request()
            .input('userId', sql.Int, newUser.user_id)
            .query('INSERT INTO Carts (user_id) VALUES (@userId)');

        // Tạo tokens
        const tokens = generateTokens(newUser.user_id, newUser.role);

        // Lưu refresh token
        await pool.request()
            .input('userId', sql.Int, newUser.user_id)
            .input('refreshToken', sql.NVarChar, tokens.refreshToken)
            .query('UPDATE Users SET refresh_token = @refreshToken WHERE user_id = @userId');

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: {
                    id: newUser.user_id,
                    email: newUser.email,
                    fullName: newUser.full_name,
                    role: newUser.role
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký'
        });
    }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const pool = getPool();

        // Tìm user theo email
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT user_id, email, password_hash, full_name, phone, avatar, role, status
                FROM Users WHERE email = @email
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        const user = result.recordset[0];

        // Kiểm tra trạng thái tài khoản
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin'
            });
        }

        // Kiểm tra password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Tạo tokens
        const tokens = generateTokens(user.user_id, user.role);

        // Cập nhật last_login và refresh_token
        await pool.request()
            .input('userId', sql.Int, user.user_id)
            .input('refreshToken', sql.NVarChar, tokens.refreshToken)
            .query(`
                UPDATE Users 
                SET last_login = GETDATE(), refresh_token = @refreshToken 
                WHERE user_id = @userId
            `);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: {
                    id: user.user_id,
                    email: user.email,
                    fullName: user.full_name,
                    phone: user.phone,
                    avatar: user.avatar,
                    role: user.role
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập'
        });
    }
};

// @desc    Đăng nhập Admin/Staff
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const pool = getPool();

        // Tìm user theo email và chỉ cho phép admin/staff
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT user_id, email, password_hash, full_name, phone, avatar, role, status, permissions
                FROM Users 
                WHERE email = @email AND role IN ('admin', 'staff')
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        const user = result.recordset[0];

        // Kiểm tra trạng thái tài khoản
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa'
            });
        }

        // Kiểm tra password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Tạo tokens
        const tokens = generateTokens(user.user_id, user.role);

        // Cập nhật last_login và refresh_token
        await pool.request()
            .input('userId', sql.Int, user.user_id)
            .input('refreshToken', sql.NVarChar, tokens.refreshToken)
            .query(`
                UPDATE Users 
                SET last_login = GETDATE(), refresh_token = @refreshToken 
                WHERE user_id = @userId
            `);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: {
                    id: user.user_id,
                    email: user.email,
                    fullName: user.full_name,
                    phone: user.phone,
                    avatar: user.avatar,
                    role: user.role,
                    permissions: user.permissions ? JSON.parse(user.permissions) : null
                },
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập'
        });
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token không được cung cấp'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const pool = getPool();

        // Kiểm tra refresh token trong database
        const result = await pool.request()
            .input('userId', sql.Int, decoded.userId)
            .input('refreshToken', sql.NVarChar, refreshToken)
            .query(`
                SELECT user_id, email, role, status 
                FROM Users 
                WHERE user_id = @userId AND refresh_token = @refreshToken AND status = 'active'
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token không hợp lệ'
            });
        }

        const user = result.recordset[0];

        // Tạo tokens mới
        const tokens = generateTokens(user.user_id, user.role);

        // Cập nhật refresh token mới
        await pool.request()
            .input('userId', sql.Int, user.user_id)
            .input('refreshToken', sql.NVarChar, tokens.refreshToken)
            .query('UPDATE Users SET refresh_token = @refreshToken WHERE user_id = @userId');

        res.json({
            success: true,
            data: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token không hợp lệ hoặc đã hết hạn'
            });
        }
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Đăng xuất
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        const pool = getPool();

        // Xóa refresh token
        await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('UPDATE Users SET refresh_token = NULL WHERE user_id = @userId');

        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng xuất'
        });
    }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT user_id, email, full_name, phone, address, avatar, role, 
                       date_of_birth, gender, created_at
                FROM Users WHERE user_id = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const user = result.recordset[0];

        res.json({
            success: true,
            data: {
                id: user.user_id,
                email: user.email,
                fullName: user.full_name,
                phone: user.phone,
                address: user.address,
                avatar: user.avatar,
                role: user.role,
                dateOfBirth: user.date_of_birth,
                gender: user.gender,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const pool = getPool();

        // Lấy password hiện tại
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query('SELECT password_hash FROM Users WHERE user_id = @userId');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Kiểm tra password hiện tại
        const isMatch = await bcrypt.compare(currentPassword, result.recordset[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Hash password mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật password
        await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET password_hash = @password, updated_at = GETDATE() WHERE user_id = @userId');

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đổi mật khẩu'
        });
    }
};

module.exports = {
    register,
    login,
    adminLogin,
    refreshToken,
    logout,
    getMe,
    changePassword
};