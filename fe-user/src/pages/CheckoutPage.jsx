import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/layout';
import { Button, Input, Spinner } from '../components/ui';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { formatCurrency } from '../utils/formatters';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.COD);
  const [loading, setLoading] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const response = await userService.getAddresses();
      const addrs = response.addresses || response.data || [];
      setAddresses(addrs);
      const defaultAddr = addrs.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else if (addrs.length > 0) {
        setSelectedAddress(addrs[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const handleAddAddress = async (data) => {
    try {
      setLoading(true);
      await userService.addAddress(data);
      await fetchAddresses();
      setShowNewAddress(false);
      reset();
      toast.success('Đã thêm địa chỉ mới');
    } catch (err) {
      toast.error('Thêm địa chỉ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        addressId: selectedAddress,
        paymentMethod,
        items: cart.items.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id,
          quantity: item.quantity,
        })),
        couponCode: cart.coupon?.code,
      };

      const response = await orderService.createOrder(orderData);
      await clearCart();
      toast.success('Đặt hàng thành công!');
      navigate(`/orders/${response.order?.id || response.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại');
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
          <p className="text-gray-600 mb-8">
            Bạn cần đăng nhập để tiến hành thanh toán.
          </p>
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (cartLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!cart?.items?.length) {
    return (
      <Layout>
        <div className="container-custom py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Giỏ hàng trống
          </h1>
          <p className="text-gray-600 mb-8">
            Bạn cần thêm sản phẩm vào giỏ hàng trước khi thanh toán.
          </p>
          <Link to="/products">
            <Button>Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-primary-600">Trang chủ</Link></li>
            <li>/</li>
            <li><Link to="/cart" className="hover:text-primary-600">Giỏ hàng</Link></li>
            <li>/</li>
            <li className="text-gray-900">Thanh toán</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Địa chỉ giao hàng
              </h2>

              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`
                        flex items-start gap-3 p-4 border rounded-lg cursor-pointer
                        ${selectedAddress === address.id ? 'border-primary-600 bg-primary-50' : 'hover:border-gray-400'}
                      `}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === address.id}
                        onChange={() => setSelectedAddress(address.id)}
                        className="mt-1 text-primary-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {address.fullName}
                          {address.isDefault && (
                            <span className="ml-2 text-xs text-primary-600">(Mặc định)</span>
                          )}
                        </p>
                        <p className="text-gray-600">{address.phone}</p>
                        <p className="text-gray-600">
                          {address.address}, {address.ward}, {address.district}, {address.city}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Bạn chưa có địa chỉ nào.</p>
              )}

              <button
                onClick={() => setShowNewAddress(!showNewAddress)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                + Thêm địa chỉ mới
              </button>

              {showNewAddress && (
                <form onSubmit={handleSubmit(handleAddAddress)} className="mt-4 space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Họ tên"
                      {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                      error={errors.fullName?.message}
                    />
                    <Input
                      label="Số điện thoại"
                      {...register('phone', { required: 'Vui lòng nhập số điện thoại' })}
                      error={errors.phone?.message}
                    />
                  </div>
                  <Input
                    label="Địa chỉ"
                    {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                    error={errors.address?.message}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Phường/Xã"
                      {...register('ward', { required: 'Vui lòng nhập phường/xã' })}
                      error={errors.ward?.message}
                    />
                    <Input
                      label="Quận/Huyện"
                      {...register('district', { required: 'Vui lòng nhập quận/huyện' })}
                      error={errors.district?.message}
                    />
                    <Input
                      label="Tỉnh/Thành phố"
                      {...register('city', { required: 'Vui lòng nhập tỉnh/thành phố' })}
                      error={errors.city?.message}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" loading={loading}>
                      Lưu địa chỉ
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowNewAddress(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <label
                    key={key}
                    className={`
                      flex items-center gap-3 p-4 border rounded-lg cursor-pointer
                      ${paymentMethod === key ? 'border-primary-600 bg-primary-50' : 'hover:border-gray-400'}
                    `}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === key}
                      onChange={() => setPaymentMethod(key)}
                      className="text-primary-600"
                    />
                    <span className="font-medium text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Đơn hàng của bạn
              </h2>

              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product?.images?.[0]?.url || '/placeholder-shoe.jpg'}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">
                        {item.product?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Size: {item.variant?.size} x {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-primary-600">
                        {formatCurrency((item.variant?.price || item.product?.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>{cart.shipping > 0 ? formatCurrency(cart.shipping) : 'Miễn phí'}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-3">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">{formatCurrency(cart.total)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handlePlaceOrder}
                loading={loading}
                disabled={!selectedAddress}
              >
                Đặt hàng
              </Button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                Bằng việc đặt hàng, bạn đồng ý với{' '}
                <Link to="/terms" className="text-primary-600 hover:underline">
                  Điều khoản dịch vụ
                </Link>{' '}
                của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
