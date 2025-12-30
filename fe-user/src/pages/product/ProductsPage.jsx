import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { Layout } from '../../components/layout';
import { ProductGrid, ProductFilter } from '../../components/product';
import { Pagination, Select, Spinner } from '../../components/ui';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useBrands } from '../../hooks/useBrands';
import { SORT_OPTIONS, DEFAULT_PAGE_SIZE } from '../../utils/constants';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const { categories } = useCategories();
  const { brands } = useBrands();

  // Get filters from URL
  const filters = {
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || null,
    brandIds: searchParams.get('brandIds')?.split(',').filter(Boolean) || [],
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null,
    sizes: searchParams.get('sizes')?.split(',').filter(Boolean).map(Number) || [],
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
    limit: DEFAULT_PAGE_SIZE,
  };

  const { products, loading, pagination, refetch } = useProducts(filters);

  // Update URL when filters change
  const handleFilterChange = (newFilters) => {
    const params = new URLSearchParams();

    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.categoryId) params.set('categoryId', newFilters.categoryId);
    if (newFilters.brandIds?.length) params.set('brandIds', newFilters.brandIds.join(','));
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.sizes?.length) params.set('sizes', newFilters.sizes.join(','));
    if (newFilters.sort) params.set('sort', newFilters.sort);
    params.set('page', '1'); // Reset to first page on filter change

    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    searchParams.set('page', page);
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e) => {
    handleFilterChange({ ...filters, sort: e.target.value });
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><a href="/" className="hover:text-primary-600">Trang chủ</a></li>
            <li>/</li>
            <li className="text-gray-900">Sản phẩm</li>
            {filters.search && (
              <>
                <li>/</li>
                <li className="text-gray-900">Tìm kiếm: "{filters.search}"</li>
              </>
            )}
          </ol>
        </nav>

        {/* Page header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {filters.search ? `Kết quả tìm kiếm cho "${filters.search}"` : 'Tất cả sản phẩm'}
            </h1>
            <p className="text-gray-600 mt-1">
              {pagination.total} sản phẩm được tìm thấy
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg"
            >
              <FunnelIcon className="h-5 w-5" />
              Bộ lọc
            </button>

            {/* Sort */}
            <div className="hidden lg:block w-48">
              <Select
                options={SORT_OPTIONS}
                value={filters.sort}
                onChange={handleSortChange}
                placeholder="Sắp xếp"
              />
            </div>

            {/* View mode */}
            <div className="hidden sm:flex items-center gap-1 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filter */}
          <aside
            className={`
              lg:w-72 flex-shrink-0
              ${showFilter ? 'block' : 'hidden lg:block'}
            `}
          >
            <ProductFilter
              categories={categories}
              brands={brands}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </aside>

          {/* Products */}
          <div className="flex-grow">
            {/* Mobile sort */}
            <div className="lg:hidden mb-4">
              <Select
                options={SORT_OPTIONS}
                value={filters.sort}
                onChange={handleSortChange}
                placeholder="Sắp xếp"
              />
            </div>

            <ProductGrid
              products={products}
              loading={loading}
              columns={viewMode === 'list' ? 2 : 4}
              emptyMessage={
                filters.search
                  ? `Không tìm thấy sản phẩm nào với từ khóa "${filters.search}"`
                  : 'Không có sản phẩm nào'
              }
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsPage;
