import React, { useState } from 'react';
import { FiUser, FiLock, FiCamera } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('info');
    
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        address: user?.address || '',
        dateOfBirth: user?.dateOfBirth?.split('T')[0] || '',
        gender: user?.gender || ''
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = () => setAvatarPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        if (!profileData.fullName.trim()) {
            toast.error('Vui lòng nhập họ tên');
            return;
        }
        
        try {
            setLoading(true);
            const data = { ...profileData };
            if (avatarFile) {
                data.avatar = avatarFile;
            }
            
            const response = await userAPI.updateProfile(data);
            updateUser(response.data.data);
            toast.success('Cập nhật thông tin thành công');
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Xác nhận mật khẩu không khớp');
            return;
        }
        
        try {
            setLoading(true);
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Đổi mật khẩu thành công');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="container">
                <h1 className="page-title">Tài khoản của tôi</h1>
                
                <div className="profile-container">
                    {/* Sidebar */}
                    <div className="profile-sidebar">
                        <div className="user-avatar">
                            <img 
                                src={avatarPreview || (user?.avatar ? `${API_URL}${user.avatar}` : '/default-avatar.png')} 
                                alt={user?.fullName}
                            />
                            <label className="avatar-upload">
                                <FiCamera />
                                <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                            </label>
                        </div>
                        <h3 className="user-name">{user?.fullName}</h3>
                        <p className="user-email">{user?.email}</p>
                        
                        <nav className="profile-nav">
                            <button 
                                className={activeTab === 'info' ? 'active' : ''}
                                onClick={() => setActiveTab('info')}
                            >
                                <FiUser /> Thông tin cá nhân
                            </button>
                            <button 
                                className={activeTab === 'password' ? 'active' : ''}
                                onClick={() => setActiveTab('password')}
                            >
                                <FiLock /> Đổi mật khẩu
                            </button>
                        </nav>
                    </div>
                    
                    {/* Content */}
                    <div className="profile-content">
                        {activeTab === 'info' && (
                            <form onSubmit={handleProfileSubmit} className="profile-form">
                                <h2>Thông tin cá nhân</h2>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Họ và tên *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            className="form-input"
                                            value={profileData.fullName}
                                            onChange={handleProfileChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            value={profileData.phone}
                                            onChange={handleProfileChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Ngày sinh</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            className="form-input"
                                            value={profileData.dateOfBirth}
                                            onChange={handleProfileChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">Giới tính</label>
                                        <select
                                            name="gender"
                                            className="form-input"
                                            value={profileData.gender}
                                            onChange={handleProfileChange}
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Địa chỉ</label>
                                    <textarea
                                        name="address"
                                        className="form-input"
                                        rows="3"
                                        value={profileData.address}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                
                                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </form>
                        )}
                        
                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordSubmit} className="profile-form">
                                <h2>Đổi mật khẩu</h2>
                                
                                <div className="form-group">
                                    <label className="form-label">Mật khẩu hiện tại *</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        className="form-input"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Mật khẩu mới *</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        className="form-input"
                                        placeholder="Ít nhất 6 ký tự"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Xác nhận mật khẩu mới *</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-input"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                    />
                                </div>
                                
                                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
