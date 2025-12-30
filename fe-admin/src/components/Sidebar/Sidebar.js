import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    FiHome, FiBox, FiLayers, FiTag, FiShoppingCart, 
    FiUsers, FiStar, FiPercent, FiSettings, FiLogOut,
    FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/', icon: FiHome, label: 'Dashboard', roles: ['admin', 'staff'] },
        { path: '/products', icon: FiBox, label: 'Sản phẩm', roles: ['admin'] },
        { path: '/categories', icon: FiLayers, label: 'Danh mục', roles: ['admin'] },
        { path: '/brands', icon: FiTag, label: 'Thương hiệu', roles: ['admin'] },
        { path: '/orders', icon: FiShoppingCart, label: 'Đơn hàng', roles: ['admin', 'staff'] },
        { path: '/users', icon: FiUsers, label: 'Người dùng', roles: ['admin'] },
        { path: '/reviews', icon: FiStar, label: 'Đánh giá', roles: ['admin', 'staff'] },
        { path: '/promotions', icon: FiPercent, label: 'Khuyến mãi', roles: ['admin'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!collapsed && <h1 className="logo">ShoesShop</h1>}
                <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {filteredMenu.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        title={collapsed ? item.label : ''}
                    >
                        <item.icon className="nav-icon" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="user-details">
                            <p className="user-name">{user?.fullName}</p>
                            <p className="user-role">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                        </div>
                    )}
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Đăng xuất">
                    <FiLogOut />
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
