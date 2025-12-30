import { Link } from 'react-router-dom';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/layout';
import { CartItem, CartSummary } from '../components/cart';
import { Button, Spinner } from '../components/ui';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const CartPage = () => {
  const { cart, loading, updateQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container-custom py-12 text-center">
          <ShoppingBagIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Vui lòng đăng nhập
          </h1>
          <p className="text-gray-600 mb-8">
            Bạn cần đăng nhập để xem giỏ hàng của mình.
          </p>
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading && !cart) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-custom py-12 text-center">
          <ShoppingBagIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Giỏ hàng trống
          </h1>
          <p className="text-gray-600 mb-8">
            Bạn chưa có sản phẩm nào trong giỏ hàng.
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
            <li className="text-gray-900">Giỏ hàng</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Giỏ hàng ({items.length} sản phẩm)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  loading={loading}
                />
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              cart={cart}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
