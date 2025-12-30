import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { Layout } from '../../components/layout';
import { Button, Input, Spinner } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, reset]);

  const handleUpdateProfile = async (data) => {
    try {
      setLoading(true);
      await userService.updateProfile(data);
      await refreshUser();
      toast.success('Cập nhật thông tin thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await userService.uploadAvatar(file);
      await refreshUser();
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (err) {
      toast.error('Cập nhật ảnh thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container-custom py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Vui lòng đăng nhập
          </h1>
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const sidebarLinks = [
    { id: 'profile', name: 'Thông tin cá nhân', icon: UserIcon },
    { id: 'orders', name: 'Đơn hàng của tôi', icon: ShoppingBagIcon, href: '/orders' },
    { id: 'wishlist', name: 'Sản phẩm yêu thích', icon: HeartIcon, href: '/wishlist' },
    { id: 'addresses', name: 'Địa chỉ', icon: MapPinIcon, href: '/addresses' },
  ];

  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tài khoản của tôi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UserIcon className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white cursor-pointer hover:bg-primary-700">
                    <CameraIcon className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <h2 className="font-semibold text-gray-900 mt-4">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  if (link.href) {
                    return (
                      <Link
                        key={link.id}
                        to={link.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
                      >
                        <Icon className="h-5 w-5" />
                        {link.name}
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={link.id}
                      onClick={() => setActiveTab(link.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg
                        ${activeTab === link.id
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      {link.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Thông tin cá nhân
              </h2>

              <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Họ và tên"
                    {...register('name', { required: 'Vui lòng nhập họ tên' })}
                    error={errors.name?.message}
                  />
                  <Input
                    label="Email"
                    type="email"
                    {...register('email')}
                    disabled
                  />
                  <Input
                    label="Số điện thoại"
                    {...register('phone', {
                      pattern: {
                        value: /^(0|\+84)[0-9]{9,10}$/,
                        message: 'Số điện thoại không hợp lệ',
                      },
                    })}
                    error={errors.phone?.message}
                  />
                  <Input
                    label="Ngày sinh"
                    type="date"
                    {...register('birthday')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="male"
                        {...register('gender')}
                        className="text-primary-600"
                      />
                      <span>Nam</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="female"
                        {...register('gender')}
                        className="text-primary-600"
                      />
                      <span>Nữ</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="other"
                        {...register('gender')}
                        className="text-primary-600"
                      />
                      <span>Khác</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" loading={loading}>
                    Lưu thay đổi
                  </Button>
                  <Link to="/change-password">
                    <Button variant="outline">Đổi mật khẩu</Button>
                  </Link>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
