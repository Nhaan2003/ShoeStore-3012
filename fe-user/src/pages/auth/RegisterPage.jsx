import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Layout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[600px] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
              <p className="text-gray-600 mt-2">
                Đăng ký để trải nghiệm mua sắm tuyệt vời
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                {...register('name', {
                  required: 'Vui lòng nhập họ tên',
                  minLength: {
                    value: 2,
                    message: 'Họ tên phải có ít nhất 2 ký tự',
                  },
                })}
                error={errors.name?.message}
              />

              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                {...register('email', {
                  required: 'Vui lòng nhập email',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email không hợp lệ',
                  },
                })}
                error={errors.email?.message}
              />

              <Input
                label="Số điện thoại"
                type="tel"
                placeholder="0901234567"
                {...register('phone', {
                  required: 'Vui lòng nhập số điện thoại',
                  pattern: {
                    value: /^(0|\+84)[0-9]{9,10}$/,
                    message: 'Số điện thoại không hợp lệ',
                  },
                })}
                error={errors.phone?.message}
              />

              <div className="relative">
                <Input
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tạo mật khẩu"
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Mật khẩu phải chứa chữ hoa, chữ thường và số',
                    },
                  })}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <Input
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu"
                {...register('confirmPassword', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: (value) =>
                    value === password || 'Mật khẩu không khớp',
                })}
                error={errors.confirmPassword?.message}
              />

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  {...register('terms', {
                    required: 'Bạn phải đồng ý với điều khoản',
                  })}
                  className="mt-1 rounded text-primary-600"
                />
                <span className="text-sm text-gray-600">
                  Tôi đồng ý với{' '}
                  <Link to="/terms" className="text-primary-600 hover:underline">
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link to="/privacy" className="text-primary-600 hover:underline">
                    Chính sách bảo mật
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <p className="text-sm text-red-500">{errors.terms.message}</p>
              )}

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Đăng ký
              </Button>
            </form>

            {/* Login link */}
            <p className="text-center text-gray-600 mt-6">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
