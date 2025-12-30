import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-column">
                        <h3>ShoesShop</h3>
                        <p className="footer-desc">
                            Chuyên cung cấp giày chính hãng với chất lượng đảm bảo và giá cả hợp lý.
                        </p>
                        <div className="social-links">
                            <a href="#" aria-label="Facebook"><FiFacebook /></a>
                            <a href="#" aria-label="Instagram"><FiInstagram /></a>
                            <a href="#" aria-label="Twitter"><FiTwitter /></a>
                            <a href="#" aria-label="Youtube"><FiYoutube /></a>
                        </div>
                    </div>
                    
                    <div className="footer-column">
                        <h3>Thông tin</h3>
                        <ul>
                            <li><Link to="/about">Về chúng tôi</Link></li>
                            <li><Link to="/contact">Liên hệ</Link></li>
                            <li><Link to="/blog">Blog</Link></li>
                            <li><Link to="/careers">Tuyển dụng</Link></li>
                        </ul>
                    </div>
                    
                    <div className="footer-column">
                        <h3>Chính sách</h3>
                        <ul>
                            <li><Link to="/privacy">Chính sách bảo mật</Link></li>
                            <li><Link to="/return-policy">Chính sách đổi trả</Link></li>
                            <li><Link to="/warranty">Chính sách bảo hành</Link></li>
                            <li><Link to="/terms">Điều khoản dịch vụ</Link></li>
                        </ul>
                    </div>
                    
                    <div className="footer-column">
                        <h3>Liên hệ</h3>
                        <ul className="contact-info">
                            <li>
                                <FiPhone />
                                <span>1800-1234 (Miễn phí)</span>
                            </li>
                            <li>
                                <FiMail />
                                <span>contact@shoesshop.com</span>
                            </li>
                            <li>
                                <FiMapPin />
                                <span>123 Đường ABC, Quận 1, TP.HCM</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>&copy; 2025 ShoesShop. Tất cả quyền được bảo lưu.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
