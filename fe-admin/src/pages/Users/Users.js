import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiLock, FiUnlock, FiSearch, FiKey } from 'react-icons/fi';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({ search: '', role: '', status: '' });
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '', password: '', fullName: '', phone: '', role: 'staff'
    });

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, filters]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            };
            const response = await userAPI.getAll(params);
            setUsers(response.data.data.users);
            setPagination(prev => ({
                ...prev,
                total: response.data.data.pagination.total,
                totalPages: response.data.data.pagination.totalPages
            }));
        } catch (error) {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            await userAPI.toggleStatus(userId);
            toast.success('Cập nhật trạng thái thành công');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật');
        }
    };

    const handleResetPassword = async (userId, email) => {
        if (!window.confirm(`Đặt lại mật khẩu cho ${email}?`)) return;
        try {
            const response = await userAPI.resetPassword(userId);
            toast.success(`Mật khẩu mới: ${response.data.data.newPassword}`);
        } catch (error) {
            toast.error('Không thể đặt lại mật khẩu');
        }
    };

    const openCreateModal = () => {
        setModalType('create');
        setFormData({ email: '', password: '', fullName: '', phone: '', role: 'staff' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await userAPI.createStaff(formData);
            toast.success('Tạo nhân viên thành công');
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tạo nhân viên');
        }
    };

    const getRoleBadge = (role) => {
        const map = {
            admin: { label: 'Admin', class: 'danger' },
            staff: { label: 'Nhân viên', class: 'info' },
            customer: { label: 'Khách hàng', class: 'secondary' }
        };
        const info = map[role] || { label: role, class: 'secondary' };
        return <span className={`badge badge-${info.class}`}>{info.label}</span>;
    };

    const getStatusBadge = (status) => {
        const map = {
            active: { label: 'Hoạt động', class: 'success' },
            inactive: { label: 'Không hoạt động', class: 'secondary' },
            locked: { label: 'Đã khóa', class: 'danger' }
        };
        const info = map[status] || { label: status, class: 'secondary' };
        return <span className={`badge badge-${info.class}`}>{info.label}</span>;
    };

    return (
        <div className="users-page">
            <div className="page-header">
                <h1 className="page-title">Quản lý người dùng</h1>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <FiPlus /> Thêm nhân viên
                </button>
            </div>

            <div className="card filters-card">
                <div className="filters-header">
                    <div className="search-box">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, SĐT..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                    <select value={filters.role} onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}>
                        <option value="">Tất cả vai trò</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Nhân viên</option>
                        <option value="customer">Khách hàng</option>
                    </select>
                    <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="locked">Đã khóa</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div></div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Email</th>
                                        <th>Số điện thoại</th>
                                        <th>Vai trò</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td><strong>{user.fullName}</strong></td>
                                            <td>{user.email}</td>
                                            <td>{user.phone || '-'}</td>
                                            <td>{getRoleBadge(user.role)}</td>
                                            <td>{getStatusBadge(user.status)}</td>
                                            <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button 
                                                        className={`btn btn-sm ${user.status === 'locked' ? 'btn-success' : 'btn-warning'}`}
                                                        onClick={() => handleToggleStatus(user.id)}
                                                        title={user.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                                                    >
                                                        {user.status === 'locked' ? <FiUnlock /> : <FiLock />}
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => handleResetPassword(user.id, user.email)}
                                                        title="Đặt lại mật khẩu"
                                                    >
                                                        <FiKey />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            {[...Array(pagination.totalPages)].map((_, idx) => (
                                <button
                                    key={idx + 1}
                                    className={pagination.page === idx + 1 ? 'active' : ''}
                                    onClick={() => setPagination(prev => ({ ...prev, page: idx + 1 }))}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Staff Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Thêm nhân viên mới</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Họ tên *</label>
                                    <input type="text" className="form-input" required
                                        value={formData.fullName}
                                        onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input type="email" className="form-input" required
                                        value={formData.email}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mật khẩu *</label>
                                    <input type="password" className="form-input" required minLength={6}
                                        value={formData.password}
                                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số điện thoại</label>
                                    <input type="tel" className="form-input"
                                        value={formData.phone}
                                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Tạo nhân viên</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
