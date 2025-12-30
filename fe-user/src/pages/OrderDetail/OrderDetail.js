import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiMapPin, FiPackage } from 'react-icons/fi';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './OrderDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getById(id);
            setOrder(response.data.data);
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error('Không thể tải thông tin đơn hàng');
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
        if (!date) return '-';
        return new Date(date).toLocaleString('vi-VN');
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Chờ xác nhận', class: 'pending', step: 1 },
            confirmed: { label: 'Đã xác nhận', class: 'confirmed', step: 2 },
            processing: { label: 'Đang xử lý', class: 'processing', step: 2 },
            shipped: { label: 'Đang giao hàng', class: 'shipped', step: 3 },
            delivered: { label: 'Đã giao hàng', class: 'delivered', step: 4 },
            cancelled: { label: 'Đã hủy', class: 'cancelled', step: 0 },
            returned: { label: 'Đã trả hàng', class: 'returned', step: 0 }
        };
        return statusMap[status] || { label: status, class: '', step: 0 };
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
        
        const reason = prompt('Lý do hủy đơn (không bắt buộc):');
        
        try {
            await orderAPI.cancel(id, reason);
            toast.success('Đã hủy đơn hàng');
            fetchOrder();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể hủy đơn hàng');
        }
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '50vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
                <h2>Không tìm thấy đơn hàng</h2>
                <Link to="/orders" className="btn btn-primary mt-3">Quay lại</Link>
            </div>
        );
    }

    const statusInfo = getStatusInfo(order.status);

    return (
        <div className="order-detail-page">
            <div className="container">
                <Link to="/orders" className="back-link">
                    <FiArrowLeft /> Quay lại danh sách đơn hàng
                </Link>
                
                <div className="order-header-section">
                    <div>
                        <h1>Đơn hàng #{order.orderCode}</h1>
                        <p className="order-date">Đặt ngày {formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                </div>
                
                {/* Order Progress */}
                {!['cancelled', 'returned'].includes(order.status) && (
                    <div className="order-progress">
                        {['Đặt hàng', 'Xác nhận', 'Đang giao', 'Hoàn thành'].map((step, idx) => (
                            <div key={idx} className={`progress-step ${idx < statusInfo.step ? 'completed' : ''} ${idx === statusInfo.step - 1 ? 'current' : ''}`}>
                                <div className="step-circle">{idx + 1}</div>
                                <span className="step-label">{step}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="order-detail-grid">
                    {/* Order Items */}
                    <div className="order-section">
                        <h3><FiPackage /> Sản phẩm đã đặt</h3>
                        <div className="order-items">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="order-item">
                                    <img 
                                        src={item.image ? `${API_URL}${item.image}` : '/placeholder-shoe.png'} 
                                        alt={item.productName}
                                    />
                                    <div className="item-info">
                                        <p className="item-name">{item.productName}</p>
                                        <p className="item-variant">Size: {item.size} | Màu: {item.color}</p>
                                        <p className="item-qty">x{item.quantity}</p>
                                    </div>
                                    <div className="item-price">
                                        <span className="unit-price">{formatPrice(item.unitPrice)}</span>
                                        <span className="subtotal">{formatPrice(item.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Order Summary */}
                        <div className="order-summary">
                            <div className="summary-row">
                                <span>Tạm tính:</span>
                                <span>{formatPrice(order.totalAmount)}</span>
                            </div>
                            {order.discountAmount > 0 && (
                                <div className="summary-row discount">
                                    <span>Giảm giá {order.promotionCode && `(${order.promotionCode})`}:</span>
                                    <span>-{formatPrice(order.discountAmount)}</span>
                                </div>
                            )}
                            <div className="summary-row">
                                <span>Phí vận chuyển:</span>
                                <span>{order.shippingFee === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Tổng cộng:</span>
                                <span>{formatPrice(order.finalAmount)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Shipping & Payment Info */}
                    <div className="order-info-sections">
                        <div className="info-section">
                            <h3><FiMapPin /> Địa chỉ giao hàng</h3>
                            <p className="info-name">{order.shipping.name}</p>
                            <p className="info-phone"><FiPhone /> {order.shipping.phone}</p>
                            <p className="info-address">{order.shipping.address}</p>
                        </div>
                        
                        <div className="info-section">
                            <h3>Thanh toán</h3>
                            <p>Phương thức: <strong>{
                                order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' :
                                order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' :
                                order.paymentMethod
                            }</strong></p>
                            <p>Trạng thái: <span className={`payment-status ${order.paymentStatus}`}>
                                {order.paymentStatus === 'pending' ? 'Chưa thanh toán' : 
                                 order.paymentStatus === 'completed' ? 'Đã thanh toán' : order.paymentStatus}
                            </span></p>
                        </div>
                        
                        {order.notes && (
                            <div className="info-section">
                                <h3>Ghi chú</h3>
                                <p>{order.notes}</p>
                            </div>
                        )}
                        
                        {order.cancelReason && (
                            <div className="info-section cancel-reason">
                                <h3>Lý do hủy</h3>
                                <p>{order.cancelReason}</p>
                            </div>
                        )}
                        
                        {/* Actions */}
                        {['pending', 'confirmed'].includes(order.status) && (
                            <button className="btn btn-danger btn-block" onClick={handleCancelOrder}>
                                Hủy đơn hàng
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
