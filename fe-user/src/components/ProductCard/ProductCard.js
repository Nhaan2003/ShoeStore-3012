import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './ProductCard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng');
            return;
        }

        // Note: This requires selecting a variant first
        // In a real app, you might redirect to product detail page
        toast.info('Vui lòng chọn size và màu sắc');
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FiStar 
                    key={i} 
                    className={i <= Math.round(rating) ? 'star filled' : 'star'} 
                />
            );
        }
        return stars;
    };

    const imageUrl = product.primaryImage 
        ? `${API_URL}${product.primaryImage}`
        : '/placeholder-shoe.png';

    return (
        <Link to={`/products/${product.id}`} className="product-card">
            <div className="product-image">
                <img 
                    src={imageUrl} 
                    alt={product.name}
                    onError={(e) => {
                        e.target.src = '/placeholder-shoe.png';
                    }}
                />
                {product.totalStock === 0 && (
                    <div className="out-of-stock-badge">Hết hàng</div>
                )}
            </div>
            
            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-brand">{product.brand?.name}</p>
                
                <div className="product-rating">
                    <div className="stars">
                        {renderStars(product.avgRating || 0)}
                    </div>
                    {product.reviewCount > 0 && (
                        <span className="review-count">({product.reviewCount})</span>
                    )}
                </div>
                
                <div className="product-price">
                    {product.minPrice !== product.maxPrice ? (
                        <span>{formatPrice(product.minPrice)} - {formatPrice(product.maxPrice)}</span>
                    ) : (
                        <span>{formatPrice(product.basePrice)}</span>
                    )}
                </div>
                
                <button 
                    className="add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={product.totalStock === 0}
                >
                    <FiShoppingCart />
                    <span>Xem chi tiết</span>
                </button>
            </div>
        </Link>
    );
};

export default ProductCard;
