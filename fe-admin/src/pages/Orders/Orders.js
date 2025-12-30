import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiSearch, FiFilter } from 'react-icons/fi';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        paymentStatus: '',
        fromDate: '',
        toDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [pagination.page, filters]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                )
            };
            const response = await orderAPI.getAll(params);
            setOrders(response.data.data.orders);
            setPagination(prev => ({
                ...prev,
                total: response.data.data.pagination.total,
                totalPages: response.data.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await orderAPI.updateStatus(orderId, { status: newStatus });
            toast.success('Cập nhật trạng thái thành công');
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('vi-VN');
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Chờ xác nhận', class: 'warning', next: 'confirmed' },
            confirmed: { label: 'Đã xác nhận', class: 'info', next: 'processing' },
            processing: { label: 'Đang xử lý', class: 'primary', next: 'shipped' },
            shipped: { label: 'Đang giao', class: 'info', next: 'delivered' },
            delivered: { label: 'Đã giao', class: 'success', next: null },
            cancelled: { label: 'Đã hủy', class: 'danger', next: null },
            returned: { label: 'Đã trả', class: 'secondary', next: null }
        };
        return statusMap[status] || { label: status, class: 'secondary', next: null };
    };

    const getPaymentStatusBadge = (status) => {
        const map = {
            pending: { label: 'Chưa thanh toán', class: 'warning' },
            completed: { label: 'Đã thanh toán', class: 'success' },
            failed: { label: 'Thất bại', class: 'danger' }
        };
        const info = map[status] || { label: status, class: 'secondary' };
        return <span className={`badge badge-${info.class}`}>{info.label}</span>;
    };

    return (
        <div className="orders-page">
            <div className="page-header">
                <h1 className="page-title">Quản lý đơn hàng</h1>
            </div>

            {/* Filters */}
            <div className="card filters-card">
                <div className="filters-header">
                    <div className="search-box">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, tên khách hàng..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                    <button 
                        className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FiFilter /> Bộ lọc
                    </button>
                </div>

                {showFilters && (
                    <div className="filters-body">
                        <select 
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="processing">Đang xử lý</option>
                            <option value="shipped">Đang giao</option>
                            <option value="delivered">Đã giao</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>

                        <select 
                            value={filters.paymentStatus}
                            onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                        >
                            <option value="">Thanh toán</option>
                            <option value="pending">Chưa thanh toán</option>
                            <option value="completed">Đã thanh toán</option>
                        </select>

                        <input 
                            type="date"
                            placeholder="Từ ngày"
                            value={filters.fromDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                        />

                        <input 
                            type="date"
                            placeholder="Đến ngày"
                            value={filters.toDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                        />
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="empty-state">
                            <p>Không tìm thấy đơn hàng nào</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Khách hàng</th>
                                        <th>Sản phẩm</th>
                                        <th>Tổng tiền</th>
                                        <th>Thanh toán</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày đặt</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => {
                                        const statusInfo = getStatusInfo(order.status);
                                        return (
                                            <tr key={order.id}>
                                                <td><strong>{order.orderCode}</strong></td>
                                                <td>
                                                    <div>
                                                        <p>{order.shipping?.name}</p>
                                                        <small className="text-muted">{order.shipping?.phone}</small>
                                                    </div>
                                                </td>
                                                <td>{order.itemCount} sản phẩm</td>
                                                <td><strong>{formatPrice(order.finalAmount)}</strong></td>
                                                <td>{getPaymentStatusBadge(order.paymentStatus)}</td>
                                                <td>
                                                    <span className={`badge badge-${statusInfo.class}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td>{formatDate(order.createdAt)}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        <Link 
                                                            to={`/orders/${order.id}`} 
                                                            className="btn btn-sm btn-secondary"
                                                        >
                                                            <FiEye />
                                                        </Link>
                                                        {statusInfo.next && (
                                                            <button 
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleStatusChange(order.id, statusInfo.next)}
                                                            >
                                                                {statusInfo.next === 'confirmed' && 'Xác nhận'}
                                                                {statusInfo.next === 'processing' && 'Xử lý'}
                                                                {statusInfo.next === 'shipped' && 'Giao hàng'}
                                                                {statusInfo.next === 'delivered' && 'Đã giao'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                ‹
                            </button>
                            {[...Array(Math.min(pagination.totalPages, 5))].map((_, idx) => (
                                <button
                                    key={idx + 1}
                                    className={pagination.page === idx + 1 ? 'active' : ''}
                                    onClick={() => setPagination(prev => ({ ...prev, page: idx + 1 }))}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                            <button
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                ›
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Orders;
