import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiRefreshCw, FiShield, FiHeadphones, FiArrowRight } from 'react-icons/fi';
import { productAPI, brandAPI, categoryAPI } from '../../services/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Home.css';

const Home = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch featured products (newest)
            const featuredRes = await productAPI.getAll({ limit: 8, sortBy: 'created_at', sortOrder: 'DESC' });
            setFeaturedProducts(featuredRes.data.data.products);

            // Fetch best sellers
            const bestRes = await productAPI.getAll({ limit: 8, sortBy: 'sold_count', sortOrder: 'DESC' });
            setBestSellers(bestRes.data.data.products);

            // Fetch brands
            const brandsRes = await brandAPI.getAll();
            setBrands(brandsRes.data.data);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page">
            {/* Hero Banner */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-banner">
                        <div className="hero-content">
                            <h1>BỘ SƯU TẬP GIÀY MỚI 2025</h1>
                            <p>Khám phá các mẫu giày mới nhất với thiết kế độc đáo và công nghệ tiên tiến</p>
                            <Link to="/products" className="hero-btn">
                                XEM NGAY <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="products-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Sản phẩm mới nhất</h2>
                        <Link to="/products?sortBy=created_at&sortOrder=DESC" className="see-all">
                            Xem tất cả <FiArrowRight />
                        </Link>
                    </div>
                    
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <div className="product-grid">
                            {featuredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Best Sellers */}
            <section className="products-section bg-gray">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Sản phẩm bán chạy</h2>
                        <Link to="/products?sortBy=sold_count&sortOrder=DESC" className="see-all">
                            Xem tất cả <FiArrowRight />
                        </Link>
                    </div>
                    
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <div className="product-grid">
                            {bestSellers.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Brands */}
            <section className="brands-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Thương hiệu nổi bật</h2>
                    </div>
                    
                    <div className="brand-grid">
                        {brands.slice(0, 6).map(brand => (
                            <Link 
                                key={brand.id} 
                                to={`/products?brand=${brand.id}`}
                                className="brand-item"
                            >
                                {brand.logo ? (
                                    <img src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${brand.logo}`} alt={brand.name} />
                                ) : (
                                    <span className="brand-name">{brand.name}</span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="benefits-section">
                <div className="container">
                    <div className="benefits-grid">
                        <div className="benefit-item">
                            <FiTruck className="benefit-icon" />
                            <h3>Giao hàng miễn phí</h3>
                            <p>Cho đơn hàng từ 1.000.000đ</p>
                        </div>
                        <div className="benefit-item">
                            <FiRefreshCw className="benefit-icon" />
                            <h3>Đổi trả trong 30 ngày</h3>
                            <p>Dễ dàng đổi trả nếu không vừa ý</p>
                        </div>
                        <div className="benefit-item">
                            <FiShield className="benefit-icon" />
                            <h3>Bảo hành chính hãng</h3>
                            <p>Cam kết 100% hàng chính hãng</p>
                        </div>
                        <div className="benefit-item">
                            <FiHeadphones className="benefit-icon" />
                            <h3>Hỗ trợ 24/7</h3>
                            <p>Luôn sẵn sàng hỗ trợ bạn</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
