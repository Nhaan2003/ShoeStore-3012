const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

// @desc    Cập nhật thông tin cá nhân
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { fullName, phone, address, dateOfBirth, gender } = req.body;
        const pool = getPool();

        let avatarUrl = null;
        if (req.file) {
            avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }

        let updateFields = `
            full_name = @fullName,
            phone = @phone,
            address = @address,
            date_of_birth = @dateOfBirth,
            gender = @gender,
            updated_at = GETDATE()
        `;

        const request = pool.request()
            .input('userId', sql.Int, req.user.userId)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar, address)
            .input('dateOfBirth', sql.Date, dateOfBirth || null)
            .input('gender', sql.VarChar, gender);

        if (avatarUrl) {
            updateFields += ', avatar = @avatar';
            request.input('avatar', sql.NVarChar, avatarUrl);
        }

        await request.query(`
            UPDATE Users SET ${updateFields} WHERE user_id = @userId
        `);

        // Lấy thông tin đã cập nhật
        const result = await pool.request()
            .input('userId', sql.Int, req.user.userId)
            .query(`
                SELECT user_id, email, full_name, phone, address, avatar, date_of_birth, gender
                FROM Users WHERE user_id = @userId
            `);

        const user = result.recordset[0];

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                id: user.user_id,
                email: user.email,
                fullName: user.full_name,
                phone: user.phone,
                address: user.address,
                avatar: user.avatar,
                dateOfBirth: user.date_of_birth,
                gender: user.gender
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin'
        });
    }
};

// @desc    Lấy danh sách users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            role, 
            status,
            search,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const pool = getPool();
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = ['1=1'];
        const request = pool.request();

        if (role) {
            whereConditions.push('role = @role');
            request.input('role', sql.VarChar, role);
        }

        if (status) {
            whereConditions.push('status = @status');
            request.input('status', sql.VarChar, status);
        }

        if (search) {
            whereConditions.push('(full_name LIKE @search OR email LIKE @search OR phone LIKE @search)');
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        const whereClause = whereConditions.join(' AND ');

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, parseInt(limit));

        const usersResult = await request.query(`
            SELECT 
                user_id,
                email,
                full_name,
                phone,
                address,
                avatar,
                role,
                status,
                last_login,
                created_at
            FROM Users
            WHERE ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        // Đếm tổng
        const countRequest = pool.request();
        if (role) countRequest.input('role', sql.VarChar, role);
        if (status) countRequest.input('status', sql.VarChar, status);
        if (search) countRequest.input('search', sql.NVarChar, `%${search}%`);

        const countResult = await countRequest.query(`
            SELECT COUNT(*) as total FROM Users WHERE ${whereClause}
        `);

        const total = countResult.recordset[0].total;

        res.json({
            success: true,
            data: {
                users: usersResult.recordset.map(u => ({
                    id: u.user_id,
                    email: u.email,
                    fullName: u.full_name,
                    phone: u.phone,
                    address: u.address,
                    avatar: u.avatar,
                    role: u.role,
                    status: u.status,
                    lastLogin: u.last_login,
                    createdAt: u.created_at
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
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy chi tiết user (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const userResult = await pool.request()
            .input('userId', sql.Int, id)
            .query(`
                SELECT 
                    user_id,
                    email,
                    full_name,
                    phone,
                    address,
                    avatar,
                    role,
                    status,
                    date_of_birth,
                    gender,
                    staff_permissions,
                    last_login,
                    created_at
                FROM Users
                WHERE user_id = @userId
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const user = userResult.recordset[0];

        // Lấy thống kê đơn hàng nếu là customer
        let orderStats = null;
        if (user.role === 'customer') {
            const statsResult = await pool.request()
                .input('userId', sql.Int, id)
                .query(`
                    SELECT 
                        COUNT(*) as total_orders,
                        SUM(CASE WHEN status = 'delivered' THEN final_amount ELSE 0 END) as total_spent,
                        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders
                    FROM Orders
                    WHERE user_id = @userId
                `);
            orderStats = statsResult.recordset[0];
        }

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
                status: user.status,
                dateOfBirth: user.date_of_birth,
                gender: user.gender,
                permissions: user.staff_permissions ? JSON.parse(user.staff_permissions) : null,
                lastLogin: user.last_login,
                createdAt: user.created_at,
                orderStats: orderStats ? {
                    totalOrders: orderStats.total_orders,
                    totalSpent: orderStats.total_spent || 0,
                    completedOrders: orderStats.completed_orders
                } : null
            }
        });

    } catch (error) {
        console.error('Get user by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Tạo nhân viên mới (Admin)
// @route   POST /api/users/staff
// @access  Private/Admin
const createStaff = async (req, res) => {
    try {
        const { email, password, fullName, phone, permissions } = req.body;
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

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.NVarChar, phone)
            .input('role', sql.VarChar, 'staff')
            .input('permissions', sql.NVarChar, JSON.stringify(permissions || []))
            .query(`
                INSERT INTO Users (email, password, full_name, phone, role, staff_permissions)
                OUTPUT INSERTED.user_id
                VALUES (@email, @password, @fullName, @phone, @role, @permissions)
            `);

        res.status(201).json({
            success: true,
            message: 'Tạo nhân viên thành công',
            data: {
                userId: result.recordset[0].user_id
            }
        });

    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo nhân viên'
        });
    }
};

// @desc    Cập nhật user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, phone, address, status, permissions } = req.body;
        const pool = getPool();

        // Kiểm tra user tồn tại
        const existing = await pool.request()
            .input('userId', sql.Int, id)
            .query('SELECT user_id, role FROM Users WHERE user_id = @userId');

        if (existing.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const request = pool.request()
            .input('userId', sql.Int, id)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar, address)
            .input('status', sql.VarChar, status);

        let permissionsUpdate = '';
        if (existing.recordset[0].role === 'staff' && permissions) {
            permissionsUpdate = ', staff_permissions = @permissions';
            request.input('permissions', sql.NVarChar, JSON.stringify(permissions));
        }

        await request.query(`
            UPDATE Users
            SET full_name = @fullName,
                phone = @phone,
                address = @address,
                status = @status,
                updated_at = GETDATE()
                ${permissionsUpdate}
            WHERE user_id = @userId
        `);

        res.json({
            success: true,
            message: 'Cập nhật thành công'
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Khóa/Mở khóa user (Admin)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const pool = getPool();

        if (!['active', 'blocked'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Kiểm tra không thể khóa admin
        const userResult = await pool.request()
            .input('userId', sql.Int, id)
            .query('SELECT role FROM Users WHERE user_id = @userId');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        if (userResult.recordset[0].role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Không thể khóa tài khoản Admin'
            });
        }

        await pool.request()
            .input('userId', sql.Int, id)
            .input('status', sql.VarChar, status)
            .query('UPDATE Users SET status = @status, updated_at = GETDATE() WHERE user_id = @userId');

        res.json({
            success: true,
            message: status === 'blocked' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản'
        });

    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Reset mật khẩu user (Admin)
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const pool = getPool();

        // Hash password mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.request()
            .input('userId', sql.Int, id)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET password = @password, updated_at = GETDATE() WHERE user_id = @userId');

        res.json({
            success: true,
            message: 'Reset mật khẩu thành công'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

// @desc    Lấy lịch sử mua hàng của user (Admin/Staff)
// @route   GET /api/users/:id/orders
// @access  Private/Admin/Staff
const getUserOrders = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const pool = getPool();
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const ordersResult = await pool.request()
            .input('userId', sql.Int, id)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, parseInt(limit))
            .query(`
                SELECT 
                    order_id,
                    order_code,
                    final_amount,
                    status,
                    payment_method,
                    payment_status,
                    created_at
                FROM Orders
                WHERE user_id = @userId
                ORDER BY created_at DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);

        const countResult = await pool.request()
            .input('userId', sql.Int, id)
            .query('SELECT COUNT(*) as total FROM Orders WHERE user_id = @userId');

        const total = countResult.recordset[0].total;

        res.json({
            success: true,
            data: {
                orders: ordersResult.recordset.map(o => ({
                    id: o.order_id,
                    orderCode: o.order_code,
                    finalAmount: o.final_amount,
                    status: o.status,
                    paymentMethod: o.payment_method,
                    paymentStatus: o.payment_status,
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
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = {
    updateProfile,
    getUsers,
    getUserById,
    createStaff,
    updateUser,
    toggleUserStatus,
    resetPassword,
    getUserOrders
};
