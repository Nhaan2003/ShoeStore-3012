import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/layout';
import { ProductGrid } from '../components/product';
import { Button, Spinner } from '../components/ui';
import { useFeaturedProducts, useNewProducts } from '../hooks/useProducts';
import { useFeaturedBrands } from '../hooks/useBrands';
import { useCategories } from '../hooks/useCategories';

const HomePage = () => {
  const { products: featuredProducts, loading: featuredLoading } = useFeaturedProducts(8);
  const { products: newProducts, loading: newLoading } = useNewProducts(8);
  const { brands, loading: brandsLoading } = useFeaturedBrands(6);
  const { categories, loading: categoriesLoading } = useCategories();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container-custom py-20 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Bước đi với phong cách
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 mb-8">
              Khám phá bộ sưu tập giày mới nhất với thiết kế độc đáo,
              chất lượng cao cấp và giá cả phải chăng.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg">
                  Mua sắm ngay
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/products?sale=true">
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-gray-900">
                  Xem khuyến mãi
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20" />
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Danh mục sản phẩm
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tìm kiếm đôi giày hoàn hảo theo nhu cầu của bạn
            </p>
          </div>

          {categoriesLoading ? (
            <div className="flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  to={`/products?categoryId=${category.id}`}
                  className="group relative overflow-hidden rounded-xl aspect-square bg-gray-100"
                >
                  <img
                    src={category.image || '/placeholder-category.jpg'}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold text-lg">
                      {category.name}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {category.productCount || 0} sản phẩm
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Sản phẩm nổi bật
              </h2>
              <p className="text-gray-600">
                Những đôi giày được yêu thích nhất
              </p>
            </div>
            <Link
              to="/products?featured=true"
              className="hidden sm:flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Xem tất cả
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <ProductGrid
            products={featuredProducts}
            loading={featuredLoading}
            columns={4}
          />

          <div className="sm:hidden mt-8 text-center">
            <Link to="/products?featured=true">
              <Button variant="outline">Xem tất cả</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Thương hiệu nổi tiếng
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Sản phẩm chính hãng từ các thương hiệu hàng đầu thế giới
            </p>
          </div>

          {brandsLoading ? (
            <div className="flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brandId=${brand.id}`}
                  className="flex items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-12 object-contain grayscale hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-xl font-bold text-gray-400">
                      {brand.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Hàng mới về
              </h2>
              <p className="text-gray-600">
                Cập nhật xu hướng mới nhất
              </p>
            </div>
            <Link
              to="/products?sort=newest"
              className="hidden sm:flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Xem tất cả
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <ProductGrid
            products={newProducts}
            loading={newLoading}
            columns={4}
          />

          <div className="sm:hidden mt-8 text-center">
            <Link to="/products?sort=newest">
              <Button variant="outline">Xem tất cả</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sản phẩm chính hãng
              </h3>
              <p className="text-gray-600">
                Cam kết 100% sản phẩm chính hãng
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Miễn phí vận chuyển
              </h3>
              <p className="text-gray-600">
                Cho đơn hàng trên 500.000đ
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Đổi trả dễ dàng
              </h3>
              <p className="text-gray-600">
                Đổi trả trong 30 ngày
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hỗ trợ 24/7
              </h3>
              <p className="text-gray-600">
                Tư vấn nhiệt tình, chu đáo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary-600">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Đăng ký nhận tin
          </h2>
          <p className="text-primary-100 max-w-2xl mx-auto mb-8">
            Nhận thông tin về sản phẩm mới và ưu đãi độc quyền
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-grow px-4 py-3 rounded-lg focus:ring-2 focus:ring-white outline-none"
            />
            <Button variant="secondary" size="lg">
              Đăng ký
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
