import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Badge, Spinner } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchOrder();
    }
  }, [isAuthenticated, id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(id);
      setOrder(response.order || response);
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    try {
      setCancelling(true);
      await orderService.cancelOrder(id, 'Khách hàng hủy đơn');
      await fetchOrder();
      toast.success('Đã hủy đơn hàng');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Hủy đơn hàng thất bại');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusVariant = (status) => {
    const colorMap = {
      yellow: 'warning',
      blue: 'info',
      indigo: 'info',
      purple: 'primary',
      green: 'success',
      red: 'danger',
      gray: 'secondary',
    };
    return colorMap[ORDER_STATUS_COLORS[status]] || 'secondary';
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container-custom py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy đơn hàng
          </h1>
          <Link to="/orders">
            <Button>Quay lại danh sách đơn hàng</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-primary-600">Trang chủ</Link></li>
            <li>/</li>
            <li><Link to="/orders" className="hover:text-primary-600">Đơn hàng</Link></li>
            <li>/</li>
            <li className="text-gray-900">{order.code}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Đơn hàng #{order.code}
            </h1>
            <p className="text-gray-600 mt-1">
              Đặt lúc {formatDateTime(order.createdAt)}
            </p>
          </div>
          <Badge variant={getStatusVariant(order.status)} size="lg">
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sản phẩm ({order.items?.length || 0})
              </h2>
              <div className="divide-y">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4">
                    <Link to={`/products/${item.product?.slug || item.product?.id}`}>
                      <img
                        src={item.product?.images?.[0]?.url || '/placeholder-shoe.jpg'}
                        alt={item.product?.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </Link>
                    <div className="flex-grow min-w-0">
                      <Link
                        to={`/products/${item.product?.slug || item.product?.id}`}
                        className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                      >
                        {item.product?.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Size: {item.variant?.size}
                        {item.variant?.color && ` | Màu: ${item.variant.color}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Số lượng: {item.quantity}
                      </p>
                      <p className="font-medium text-primary-600 mt-2">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Địa chỉ giao hàng
              </h2>
              <div className="text-gray-600">
                <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.phone}</p>
                <p>
                  {order.shippingAddress?.address}, {order.shippingAddress?.ward},{' '}
                  {order.shippingAddress?.district}, {order.shippingAddress?.city}
                </p>
              </div>
            </div>

            {/* Order timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Lịch sử đơn hàng
              </h2>
              <div className="space-y-4">
                {order.timeline?.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-600" />
                      {index < order.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(event.createdAt)}
                      </p>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin thanh toán
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>
                    {order.shipping > 0 ? formatCurrency(order.shipping) : 'Miễn phí'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-3">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">{formatCurrency(order.total)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phương thức thanh toán:</span>{' '}
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Trạng thái thanh toán:</span>{' '}
                  {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </p>
              </div>

              {canCancel && (
                <Button
                  variant="danger"
                  className="w-full mt-6"
                  onClick={handleCancelOrder}
                  loading={cancelling}
                >
                  Hủy đơn hàng
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;
