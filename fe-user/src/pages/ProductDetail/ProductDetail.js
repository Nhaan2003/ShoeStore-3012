import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiShoppingCart, FiHeart, FiStar, FiChevronRight } from 'react-icons/fi';
import { productAPI } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(null);

    useEffect(() => {
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const [productRes, relatedRes] = await Promise.all([
                productAPI.getById(id),
                productAPI.getRelated(id)
            ]);
            
            setProduct(productRes.data.data);
            setRelatedProducts(relatedRes.data.data);
            
            if (productRes.data.data.images?.length > 0) {
                setMainImage(productRes.data.data.images[0].url);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Không thể tải thông tin sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const getSelectedVariant = () => {
        if (!selectedSize || !selectedColor || !product) return null;
        return product.variants.find(
            v => v.size === selectedSize && v.color === selectedColor
        );
    };

    const getCurrentPrice = () => {
        const variant = getSelectedVariant();
        return variant?.price || product?.basePrice || 0;
    };

    const getStock = () => {
        const variant = getSelectedVariant();
        return variant?.stock || 0;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng');
            return;
        }

        if (!selectedSize || !selectedColor) {
            toast.warning('Vui lòng chọn size và màu sắc');
            return;
        }

        const variant = getSelectedVariant();
        if (!variant) {
            toast.error('Không tìm thấy phiên bản sản phẩm');
            return;
        }

        if (variant.stock < quantity) {
            toast.error('Số lượng vượt quá tồn kho');
            return;
        }

        try {
            await addToCart(variant.id, quantity);
            toast.success('Đã thêm vào giỏ hàng');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
        }
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

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '50vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
                <h2>Không tìm thấy sản phẩm</h2>
                <Link to="/products" className="btn btn-primary mt-3">Quay lại cửa hàng</Link>
            </div>
        );
    }

    return (
        <div className="product-detail-page">
            <div className="container">
                <div className="breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <FiChevronRight />
                    <Link to="/products">Sản phẩm</Link>
                    <FiChevronRight />
                    <span>{product.name}</span>
                </div>

                <div className="product-detail-container">
                    <div className="product-gallery">
                        <div className="main-image">
                            <img 
                                src={mainImage ? `${API_URL}${mainImage}` : '/placeholder-shoe.png'} 
                                alt={product.name}
                                onError={(e) => { e.target.src = '/placeholder-shoe.png'; }}
                            />
                        </div>
                        <div className="thumbnail-gallery">
                            {product.images?.map((img, idx) => (
                                <div 
                                    key={idx}
                                    className={`thumbnail ${mainImage === img.url ? 'active' : ''}`}
                                    onClick={() => setMainImage(img.url)}
                                >
                                    <img 
                                        src={`${API_URL}${img.url}`} 
                                        alt={`${product.name} ${idx + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="product-info">
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-brand">Thương hiệu: <strong>{product.brand?.name}</strong></p>
                        
                        <div className="product-rating">
                            <div className="stars">{renderStars(product.rating?.average)}</div>
                            <span className="rating-count">({product.rating?.total || 0} đánh giá)</span>
                        </div>

                        <div className="product-price">{formatPrice(getCurrentPrice())}</div>

                        <div className="stock-status">
                            {selectedSize && selectedColor ? (
                                getStock() > 0 ? (
                                    <span className="in-stock">✓ Còn {getStock()} sản phẩm</span>
                                ) : (
                                    <span className="out-of-stock">✗ Hết hàng</span>
                                )
                            ) : (
                                <span className="select-variant">Vui lòng chọn size và màu</span>
                            )}
                        </div>

                        <div className="variant-section">
                            <label>Kích cỡ:</label>
                            <div className="size-options">
                                {product.availableSizes?.map(size => (
                                    <button
                                        key={size}
                                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="variant-section">
                            <label>Màu sắc:</label>
                            <div className="color-options">
                                {product.availableColors?.map(color => (
                                    <button
                                        key={color.name}
                                        className={`color-btn ${selectedColor === color.name ? 'active' : ''}`}
                                        style={{ backgroundColor: color.code || '#ccc' }}
                                        onClick={() => setSelectedColor(color.name)}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            {selectedColor && <span className="selected-color">{selectedColor}</span>}
                        </div>

                        <div className="quantity-section">
                            <label>Số lượng:</label>
                            <div className="quantity-control">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                                    <FiMinus />
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                />
                                <button onClick={() => setQuantity(quantity + 1)}>
                                    <FiPlus />
                                </button>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button
                                className="btn btn-primary btn-lg add-cart-btn"
                                onClick={handleAddToCart}
                                disabled={!selectedSize || !selectedColor || getStock() === 0}
                            >
                                <FiShoppingCart /> Thêm vào giỏ hàng
                            </button>
                            <button className="btn btn-outline wishlist-btn">
                                <FiHeart />
                            </button>
                        </div>

                        <div className="product-description">
                            <h3>Mô tả sản phẩm</h3>
                            <p>{product.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                {product.reviews?.length > 0 && (
                    <div className="reviews-section">
                        <h2>Đánh giá từ khách hàng</h2>
                        <div className="reviews-list">
                            {product.reviews.map((review, idx) => (
                                <div key={idx} className="review-item">
                                    <div className="review-header">
                                        <span className="reviewer-name">{review.userName}</span>
                                        <div className="review-stars">{renderStars(review.rating)}</div>
                                    </div>
                                    <p className="review-comment">{review.comment}</p>
                                    <span className="review-date">
                                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="related-section">
                        <h2>Sản phẩm liên quan</h2>
                        <div className="related-grid">
                            {relatedProducts.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
