import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import './Cart.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Cart = () => {
    const navigate = useNavigate();
    const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        try {
            await updateQuantity(itemId, newQuantity);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng');
        }
    };

    const handleRemoveItem = async (itemId) => {
        if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            try {
                await removeItem(itemId);
                toast.success('Đã xóa sản phẩm');
            } catch (error) {
                toast.error('Không thể xóa sản phẩm');
            }
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
            try {
                await clearCart();
                toast.success('Đã xóa giỏ hàng');
            } catch (error) {
                toast.error('Không thể xóa giỏ hàng');
            }
        }
    };

    const handleCheckout = () => {
        const unavailableItems = cart.items.filter(item => !item.isAvailable);
        if (unavailableItems.length > 0) {
            toast.warning('Vui lòng xóa các sản phẩm không khả dụng trước khi thanh toán');
            return;
        }
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '50vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="empty-cart">
                        <FiShoppingBag className="empty-icon" />
                        <h2>Giỏ hàng trống</h2>
                        <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                        <Link to="/products" className="btn btn-primary">
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <h1 className="page-title">Giỏ hàng của bạn</h1>
                
                <div className="cart-container">
                    <div className="cart-items">
                        <div className="cart-header">
                            <span>Sản phẩm</span>
                            <span>Đơn giá</span>
                            <span>Số lượng</span>
                            <span>Thành tiền</span>
                            <span></span>
                        </div>
                        
                        {cart.items.map(item => (
                            <div key={item.cartItemId} className={`cart-item ${!item.isAvailable ? 'unavailable' : ''}`}>
                                <div className="item-product">
                                    <Link to={`/products/${item.product.id}`} className="item-image">
                                        <img 
                                            src={item.product.image ? `${API_URL}${item.product.image}` : '/placeholder-shoe.png'} 
                                            alt={item.product.name}
                                        />
                                    </Link>
                                    <div className="item-info">
                                        <Link to={`/products/${item.product.id}`} className="item-name">
                                            {item.product.name}
                                        </Link>
                                        <p className="item-variant">
                                            Size: {item.variant.size} | Màu: {item.variant.color}
                                        </p>
                                        {!item.isAvailable && (
                                            <span className="unavailable-badge">
                                                {item.stock === 0 ? 'Hết hàng' : `Chỉ còn ${item.stock}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="item-price">
                                    {formatPrice(item.price)}
                                </div>
                                
                                <div className="item-quantity">
                                    <div className="quantity-control">
                                        <button 
                                            onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <FiMinus />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button 
                                            onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                                            disabled={item.quantity >= item.stock}
                                        >
                                            <FiPlus />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="item-subtotal">
                                    {formatPrice(item.subtotal)}
                                </div>
                                
                                <button 
                                    className="remove-btn"
                                    onClick={() => handleRemoveItem(item.cartItemId)}
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                        
                        <div className="cart-actions">
                            <Link to="/products" className="btn btn-outline">
                                ← Tiếp tục mua sắm
                            </Link>
                            <button className="btn btn-danger" onClick={handleClearCart}>
                                Xóa tất cả
                            </button>
                        </div>
                    </div>
                    
                    <div className="cart-summary">
                        <h3>Tóm tắt đơn hàng</h3>
                        
                        <div className="summary-row">
                            <span>Tổng sản phẩm:</span>
                            <span>{cart.totalItems}</span>
                        </div>
                        
                        <div className="summary-row">
                            <span>Tạm tính:</span>
                            <span>{formatPrice(cart.totalAmount)}</span>
                        </div>
                        
                        <div className="summary-row">
                            <span>Phí vận chuyển:</span>
                            <span>{cart.totalAmount >= 1000000 ? 'Miễn phí' : formatPrice(30000)}</span>
                        </div>
                        
                        <div className="summary-total">
                            <span>Tổng cộng:</span>
                            <span className="total-amount">
                                {formatPrice(cart.totalAmount + (cart.totalAmount >= 1000000 ? 0 : 30000))}
                            </span>
                        </div>
                        
                        <button 
                            className="btn btn-primary btn-block btn-lg checkout-btn"
                            onClick={handleCheckout}
                        >
                            Tiến hành thanh toán
                        </button>
                        
                        <p className="free-shipping-note">
                            {cart.totalAmount >= 1000000 
                                ? '✓ Bạn đã được miễn phí vận chuyển!'
                                : `Mua thêm ${formatPrice(1000000 - cart.totalAmount)} để được miễn phí vận chuyển`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
