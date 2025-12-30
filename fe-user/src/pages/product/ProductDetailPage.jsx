import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HeartIcon,
  ShareIcon,
  ShoppingBagIcon,
  TruckIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Layout } from '../../components/layout';
import { ProductGrid } from '../../components/product';
import { Button, Rating, Spinner, Badge } from '../../components/ui';
import { useProduct, useRelatedProducts } from '../../hooks/useProducts';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, calculateDiscount } from '../../utils/formatters';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { products: relatedProducts, loading: relatedLoading } = useRelatedProducts(id);
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      // Set default selections
      if (product.variants?.length > 0) {
        const availableSizes = [...new Set(product.variants.map(v => v.size))];
        const availableColors = [...new Set(product.variants.map(v => v.color))];
        if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);
        if (availableColors.length > 0) setSelectedColor(availableColors[0]);
      }

      // Fetch reviews
      fetchReviews();
    }
  }, [product]);

  const fetchReviews = async () => {
    if (!product) return;
    try {
      setReviewsLoading(true);
      const response = await reviewService.getProductReviews(product.id, { limit: 5 });
      setReviews(response.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Vui lòng chọn kích cỡ');
      return;
    }

    const variant = product.variants?.find(
      v => v.size === selectedSize && (!selectedColor || v.color === selectedColor)
    );

    if (!variant) {
      toast.error('Sản phẩm này hiện không có sẵn');
      return;
    }

    await addToCart(product.id, variant.id, quantity);
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    try {
      if (isWishlisted) {
        await userService.removeFromWishlist(product.id);
        setIsWishlisted(false);
        toast.success('Đã xóa khỏi danh sách yêu thích');
      } else {
        await userService.addToWishlist(product.id);
        setIsWishlisted(true);
        toast.success('Đã thêm vào danh sách yêu thích');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container-custom py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy sản phẩm
          </h1>
          <p className="text-gray-600 mb-8">
            Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.
          </p>
          <Link to="/products">
            <Button>Quay lại trang sản phẩm</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const images = product.images || [];
  const discount = calculateDiscount(product.price, product.salePrice);
  const displayPrice = product.salePrice || product.price;
  const availableSizes = [...new Set(product.variants?.map(v => v.size) || [])];
  const availableColors = [...new Set(product.variants?.map(v => v.color) || [])];

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-primary-600">Trang chủ</Link></li>
            <li>/</li>
            <li><Link to="/products" className="hover:text-primary-600">Sản phẩm</Link></li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              <img
                src={images[selectedImage]?.url || '/placeholder-shoe.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`
                      flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden
                      ${selectedImage === index ? 'ring-2 ring-primary-600' : 'ring-1 ring-gray-200'}
                    `}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            {/* Brand */}
            {product.brand && (
              <Link
                to={`/products?brandId=${product.brand.id}`}
                className="text-sm text-gray-500 uppercase tracking-wide hover:text-primary-600"
              >
                {product.brand.name}
              </Link>
            )}

            {/* Name */}
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mt-4">
              <Rating value={product.rating || 0} showValue />
              <span className="text-sm text-gray-500">
                ({product.reviewCount || 0} đánh giá)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mt-6">
              <span className="text-3xl font-bold text-primary-600">
                {formatCurrency(displayPrice)}
              </span>
              {product.salePrice && product.price > product.salePrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <Badge variant="danger">-{discount}%</Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 mt-6 leading-relaxed">
              {product.description}
            </p>

            {/* Size selection */}
            {availableSizes.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">Kích cỡ</span>
                  <Link to="/size-guide" className="text-sm text-primary-600 hover:underline">
                    Hướng dẫn chọn size
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.sort((a, b) => a - b).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        w-14 h-12 rounded-lg font-medium transition-colors
                        ${selectedSize === size
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selection */}
            {availableColors.length > 0 && availableColors[0] && (
              <div className="mt-6">
                <span className="font-medium text-gray-900 mb-3 block">Màu sắc</span>
                <div className="flex flex-wrap gap-2">
                  {availableColors.filter(Boolean).map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-colors
                        ${selectedColor === color
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <span className="font-medium text-gray-900 mb-3 block">Số lượng</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <Button
                size="lg"
                className="flex-grow"
                onClick={handleAddToCart}
                loading={cartLoading}
              >
                <ShoppingBagIcon className="h-5 w-5 mr-2" />
                Thêm vào giỏ hàng
              </Button>
              <button
                onClick={handleWishlistToggle}
                className="p-4 border rounded-lg hover:bg-gray-50"
              >
                {isWishlisted ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
              <button className="p-4 border rounded-lg hover:bg-gray-50">
                <ShareIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Benefits */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <TruckIcon className="h-6 w-6 text-primary-600" />
                <span>Miễn phí vận chuyển cho đơn hàng trên 500.000đ</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <ArrowPathIcon className="h-6 w-6 text-primary-600" />
                <span>Đổi trả miễn phí trong 30 ngày</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
                <span>Cam kết sản phẩm chính hãng 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Đánh giá sản phẩm
          </h2>

          {reviewsLoading ? (
            <Spinner />
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-xl border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {review.user?.name?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.user?.name || 'Người dùng'}
                        </p>
                        <Rating value={review.rating} size="sm" />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-gray-600">{review.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
          )}
        </section>

        {/* Related products */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Sản phẩm liên quan
          </h2>
          <ProductGrid
            products={relatedProducts}
            loading={relatedLoading}
            columns={4}
          />
        </section>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
