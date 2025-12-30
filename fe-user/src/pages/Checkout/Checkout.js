import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { orderAPI, promotionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Checkout.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, fetchCart } = useCart();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        shippingName: user?.fullName || '',
        shippingPhone: user?.phone || '',
        shippingAddress: user?.address || '',
        paymentMethod: 'COD',
        promotionCode: '',
        notes: ''
    });
    
    const [discount, setDiscount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [errors, setErrors] = useState({});

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleVerifyPromotion = async () => {
        if (!formData.promotionCode.trim()) return;
        
        try {
            setVerifyingCode(true);
            const response = await promotionAPI.verify(formData.promotionCode, cart.totalAmount);
            setDiscount(response.data.data);
            toast.success('Áp dụng mã giảm giá thành công!');
        } catch (error) {
            setDiscount(null);
            toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
        } finally {
            setVerifyingCode(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.shippingName.trim()) {
            newErrors.shippingName = 'Vui lòng nhập tên người nhận';
        }
        if (!formData.shippingPhone || !/^[0-9]{10,11}$/.test(formData.shippingPhone)) {
            newErrors.shippingPhone = 'Số điện thoại không hợp lệ';
        }
        if (!formData.shippingAddress.trim()) {
            newErrors.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        try {
            setLoading(true);
            const response = await orderAPI.create({
                ...formData,
                promotionCode: discount ? formData.promotionCode : null
            });
            
            toast.success('Đặt hàng thành công!');
            await fetchCart();
            navigate(`/orders/${response.data.data.orderId}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể đặt hàng');
        } finally {
            setLoading(false);
        }
    };

    const shippingFee = cart.totalAmount >= 1000000 ? 0 : 30000;
    const discountAmount = discount?.discountAmount || 0;
    const finalAmount = cart.totalAmount - discountAmount + (discount?.isFreeShipping ? 0 : shippingFee);

    return (
        <div className="checkout-page">
            <div className="container">
                <h1 className="page-title">Thanh toán</h1>
                
                <form onSubmit={handleSubmit} className="checkout-container">
                    <div className="checkout-form">
                        {/* Shipping Info */}
                        <div className="form-section">
                            <h3>Thông tin giao hàng</h3>
                            
                            <div className="form-group">
                                <label className="form-label">Họ tên người nhận *</label>
                                <input
                                    type="text"
                                    name="shippingName"
                                    className={`form-input ${errors.shippingName ? 'error' : ''}`}
                                    value={formData.shippingName}
                                    onChange={handleChange}
                                />
                                {errors.shippingName && <span className="form-error">{errors.shippingName}</span>}
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Số điện thoại *</label>
                                <input
                                    type="tel"
                                    name="shippingPhone"
                                    className={`form-input ${errors.shippingPhone ? 'error' : ''}`}
                                    value={formData.shippingPhone}
                                    onChange={handleChange}
                                />
                                {errors.shippingPhone && <span className="form-error">{errors.shippingPhone}</span>}
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Địa chỉ giao hàng *</label>
                                <textarea
                                    name="shippingAddress"
                                    className={`form-input ${errors.shippingAddress ? 'error' : ''}`}
                                    rows="3"
                                    value={formData.shippingAddress}
                                    onChange={handleChange}
                                />
                                {errors.shippingAddress && <span className="form-error">{errors.shippingAddress}</span>}
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Ghi chú</label>
                                <textarea
                                    name="notes"
                                    className="form-input"
                                    rows="2"
                                    placeholder="Ghi chú cho đơn hàng (nếu có)"
                                    value={formData.notes}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        
                        {/* Payment Method */}
                        <div className="form-section">
                            <h3>Phương thức thanh toán</h3>
                            
                            <div className="payment-options">
                                {[
                                    { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)' },
                                    { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng' },
                                    { value: 'VNPAY', label: 'Thanh toán qua VNPAY' },
                                    { value: 'MOMO', label: 'Thanh toán qua MoMo' }
                                ].map(method => (
                                    <label key={method.value} className="payment-option">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={method.value}
                                            checked={formData.paymentMethod === method.value}
                                            onChange={handleChange}
                                        />
                                        <span>{method.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Order Summary */}
                    <div className="order-summary">
                        <h3>Đơn hàng của bạn</h3>
                        
                        <div className="order-items">
                            {cart.items.map(item => (
                                <div key={item.cartItemId} className="order-item">
                                    <img 
                                        src={item.product.image ? `${API_URL}${item.product.image}` : '/placeholder-shoe.png'} 
                                        alt={item.product.name}
                                    />
                                    <div className="order-item-info">
                                        <p className="item-name">{item.product.name}</p>
                                        <p className="item-variant">{item.variant.size} / {item.variant.color}</p>
                                        <p className="item-qty">x{item.quantity}</p>
                                    </div>
                                    <span className="item-price">{formatPrice(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Promotion Code */}
                        <div className="promo-section">
                            <div className="promo-input">
                                <input
                                    type="text"
                                    placeholder="Nhập mã giảm giá"
                                    value={formData.promotionCode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, promotionCode: e.target.value.toUpperCase() }))}
                                />
                                <button 
                                    type="button"
                                    onClick={handleVerifyPromotion}
                                    disabled={verifyingCode || !formData.promotionCode}
                                >
                                    {verifyingCode ? '...' : 'Áp dụng'}
                                </button>
                            </div>
                            {discount && (
                                <p className="promo-success">
                                    ✓ {discount.name}: Giảm {formatPrice(discountAmount)}
                                </p>
                            )}
                        </div>
                        
                        {/* Totals */}
                        <div className="order-totals">
                            <div className="total-row">
                                <span>Tạm tính:</span>
                                <span>{formatPrice(cart.totalAmount)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="total-row discount">
                                    <span>Giảm giá:</span>
                                    <span>-{formatPrice(discountAmount)}</span>
                                </div>
                            )}
                            <div className="total-row">
                                <span>Phí vận chuyển:</span>
                                <span>{discount?.isFreeShipping || shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                            </div>
                            <div className="total-row final">
                                <span>Tổng cộng:</span>
                                <span>{formatPrice(finalAmount)}</span>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block btn-lg"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
