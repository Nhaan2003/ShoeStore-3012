import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Layout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await forgotPassword(data.email);
      setEmailSent(true);
      toast.success('Email đặt lại mật khẩu đã được gửi!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi email thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[600px] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {emailSent ? (
              // Success state
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Kiểm tra email của bạn
                </h1>
                <p className="text-gray-600 mb-6">
                  Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{' '}
                  <span className="font-medium">{getValues('email')}</span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Không nhận được email? Kiểm tra thư mục spam hoặc
                </p>
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                  className="mb-4"
                >
                  Thử với email khác
                </Button>
                <Link
                  to="/login"
                  className="block text-primary-600 hover:text-primary-700 font-medium"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              // Form state
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Quên mật khẩu?
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

                  <Button type="submit" className="w-full" size="lg" loading={loading}>
                    Gửi link đặt lại mật khẩu
                  </Button>
                </form>

                {/* Back to login */}
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-gray-600 hover:text-primary-600 mt-6"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Quay lại đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
