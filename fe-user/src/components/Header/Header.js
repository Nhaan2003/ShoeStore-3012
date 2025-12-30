import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { cart } = useCart();
    const [searchTerm, setSearchTerm] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setShowUserMenu(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.user-menu-container')) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <header className="header">
            <div className="container header-container">
                <Link to="/" className="logo">ShoesShop</Link>

                <form className="search-bar" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="search-btn">
                        <FiSearch />
                    </button>
                </form>

                <nav className={`nav-menu ${showMobileMenu ? 'show' : ''}`}>
                    <Link to="/" onClick={() => setShowMobileMenu(false)}>Trang chủ</Link>
                    <Link to="/products?gender=male" onClick={() => setShowMobileMenu(false)}>Giày nam</Link>
                    <Link to="/products?gender=female" onClick={() => setShowMobileMenu(false)}>Giày nữ</Link>
                    <Link to="/products" onClick={() => setShowMobileMenu(false)}>Sản phẩm</Link>
                </nav>

                <div className="user-actions">
                    <Link to="/cart" className="cart-link">
                        <FiShoppingCart />
                        {cart.totalItems > 0 && (
                            <span className="cart-count">{cart.totalItems}</span>
                        )}
                    </Link>

                    {isAuthenticated ? (
                        <div className="user-menu-container">
                            <button 
                                className="user-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUserMenu(!showUserMenu);
                                }}
                            >
                                <FiUser />
                                <span className="user-name">{user?.fullName?.split(' ').pop()}</span>
                            </button>
                            
                            {showUserMenu && (
                                <div className="user-dropdown">
                                    <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                                        Tài khoản của tôi
                                    </Link>
                                    <Link to="/orders" onClick={() => setShowUserMenu(false)}>
                                        Đơn hàng
                                    </Link>
                                    <button onClick={handleLogout} className="logout-btn">
                                        <FiLogOut /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="login-link">
                            <FiUser />
                            <span>Đăng nhập</span>
                        </Link>
                    )}

                    <button 
                        className="mobile-menu-btn"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                    >
                        {showMobileMenu ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
