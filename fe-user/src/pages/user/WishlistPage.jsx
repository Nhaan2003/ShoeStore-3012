import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';
import { Layout } from '../../components/layout';
import { ProductGrid } from '../../components/product';
import { Button, Spinner } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await userService.getWishlist();
      setProducts(response.products || response.data || []);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await userService.removeFromWishlist(productId);
      setProducts(products.filter((p) => p.id !== productId));
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } catch (err) {
      toast.error('Xóa sản phẩm thất bại');
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container-custom py-12 text-center">
          <HeartIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Vui lòng đăng nhập
          </h1>
          <p className="text-gray-600 mb-8">
            Đăng nhập để xem danh sách sản phẩm yêu thích của bạn.
          </p>
          <Link to="/login">
            <Button>Đăng nhập</Button>
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
            <li><Link to="/profile" className="hover:text-primary-600">Tài khoản</Link></li>
            <li>/</li>
            <li className="text-gray-900">Yêu thích</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Sản phẩm yêu thích ({products.length})
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <HeartIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có sản phẩm yêu thích
            </h2>
            <p className="text-gray-600 mb-6">
              Hãy khám phá và thêm sản phẩm vào danh sách yêu thích!
            </p>
            <Link to="/products">
              <Button>Khám phá sản phẩm</Button>
            </Link>
          </div>
        ) : (
          <ProductGrid
            products={products}
            wishlist={products.map((p) => p.id)}
            onWishlistToggle={handleRemoveFromWishlist}
            columns={4}
          />
        )}
      </div>
    </Layout>
  );
};

export default WishlistPage;
