import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import { orderAPI } from '../../services/api';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    useEffect(() => {
        fetchOrders();
    }, [activeTab, pagination.page]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = { page: pagination.page, limit: 10 };
            if (activeTab !== 'all') params.status = activeTab;
            
            const response = await orderAPI.getMyOrders(params);
            setOrders(response.data.data.orders);
            setPagination(prev => ({
                ...prev,
                totalPages: response.data.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Chờ xác nhận', class: 'pending' },
            confirmed: { label: 'Đã xác nhận', class: 'confirmed' },
            processing: { label: 'Đang xử lý', class: 'processing' },
            shipped: { label: 'Đang giao', class: 'shipped' },
            delivered: { label: 'Đã giao', class: 'delivered' },
            cancelled: { label: 'Đã hủy', class: 'cancelled' },
            returned: { label: 'Đã trả', class: 'returned' }
        };
        return statusMap[status] || { label: status, class: '' };
    };

    const tabs = [
        { key: 'all', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ xác nhận' },
        { key: 'processing', label: 'Đang xử lý' },
        { key: 'shipped', label: 'Đang giao' },
        { key: 'delivered', label: 'Đã giao' },
        { key: 'cancelled', label: 'Đã hủy' }
    ];

    return (
        <div className="orders-page">
            <div className="container">
                <h1 className="page-title">Đơn hàng của tôi</h1>
                
                {/* Tabs */}
                <div className="order-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab.key);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* Orders List */}
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-orders">
                        <FiPackage className="empty-icon" />
                        <h3>Chưa có đơn hàng nào</h3>
                        <p>Hãy khám phá và đặt hàng ngay!</p>
                        <Link to="/products" className="btn btn-primary">
                            Mua sắm ngay
                        </Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => {
                            const statusInfo = getStatusInfo(order.status);
                            return (
                                <Link 
                                    key={order.id} 
                                    to={`/orders/${order.id}`}
                                    className="order-card"
                                >
                                    <div className="order-header">
                                        <div className="order-info">
                                            <span className="order-code">#{order.orderCode}</span>
                                            <span className="order-date">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <span className={`order-status ${statusInfo.class}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    
                                    <div className="order-content">
                                        {order.firstItemImage && (
                                            <div className="order-image">
                                                <img 
                                                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${order.firstItemImage}`} 
                                                    alt=""
                                                />
                                                {order.itemCount > 1 && (
                                                    <span className="more-items">+{order.itemCount - 1}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="order-details">
                                            <p>{order.itemCount} sản phẩm</p>
                                            <p className="order-total">
                                                Tổng: <strong>{formatPrice(order.finalAmount)}</strong>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="order-arrow">
                                        <FiChevronRight />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        {[...Array(pagination.totalPages)].map((_, idx) => (
                            <button
                                key={idx + 1}
                                className={`page-btn ${pagination.page === idx + 1 ? 'active' : ''}`}
                                onClick={() => setPagination(prev => ({ ...prev, page: idx + 1 }))}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
