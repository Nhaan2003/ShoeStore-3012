import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Layout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Link đặt lại mật khẩu không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, data.password);
      setSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Layout>
        <div className="min-h-[600px] flex items-center justify-center py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Link không hợp lệ
            </h1>
            <p className="text-gray-600 mb-8">
              Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </p>
            <Link to="/forgot-password">
              <Button>Yêu cầu link mới</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[600px] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {success ? (
              // Success state
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Mật khẩu đã được đặt lại
                </h1>
                <p className="text-gray-600 mb-6">
                  Bạn có thể đăng nhập với mật khẩu mới.
                </p>
                <Link to="/login">
                  <Button className="w-full" size="lg">
                    Đăng nhập
                  </Button>
                </Link>
              </div>
            ) : (
              // Form state
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Đặt lại mật khẩu
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Tạo mật khẩu mới cho tài khoản của bạn
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="relative">
                    <Input
                      label="Mật khẩu mới"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu mới"
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

                  <Button type="submit" className="w-full" size="lg" loading={loading}>
                    Đặt lại mật khẩu
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
