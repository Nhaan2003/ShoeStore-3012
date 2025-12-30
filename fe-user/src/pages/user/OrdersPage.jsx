import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Badge, Spinner, Pagination } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';

const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders({ page, limit: 10 });
      setOrders(response.orders || response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
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

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-primary-600">Trang chủ</Link></li>
            <li>/</li>
            <li><Link to="/profile" className="hover:text-primary-600">Tài khoản</Link></li>
            <li>/</li>
            <li className="text-gray-900">Đơn hàng</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn hàng của tôi</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có đơn hàng nào
            </h2>
            <p className="text-gray-600 mb-6">
              Hãy mua sắm để có đơn hàng đầu tiên!
            </p>
            <Link to="/products">
              <Button>Mua sắm ngay</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Order header */}
                  <div className="px-6 py-4 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Mã đơn hàng</p>
                        <p className="font-medium text-gray-900">{order.code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ngày đặt</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(order.status)}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>

                  {/* Order items */}
                  <div className="px-6 py-4">
                    {order.items?.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex gap-4 py-3">
                        <img
                          src={item.product?.images?.[0]?.url || '/placeholder-shoe.jpg'}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {item.product?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Size: {item.variant?.size} x {item.quantity}
                          </p>
                          <p className="text-primary-600 font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 2 && (
                      <p className="text-sm text-gray-500 mt-2">
                        +{order.items.length - 2} sản phẩm khác
                      </p>
                    )}
                  </div>

                  {/* Order footer */}
                  <div className="px-6 py-4 border-t flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-gray-500">Tổng tiền: </span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Xem chi tiết
                        </Button>
                      </Link>
                      {order.status === 'delivered' && (
                        <Link to={`/orders/${order.id}/review`}>
                          <Button size="sm">Đánh giá</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;
