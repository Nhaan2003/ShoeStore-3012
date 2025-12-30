import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Table,
  Pagination,
  ProductStatusBadge,
  Modal,
} from '../../components/common';
import { productAdminService, categoryService, brandService } from '../../services';
import { Product, Category, Brand } from '../../types';
import toast from 'react-hot-toast';

export function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    brand_id: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });

  useEffect(() => {
    loadProducts();
  }, [page, filters]);

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productAdminService.getProducts({
        page,
        limit: 10,
        search: search || undefined,
        category_id: filters.category_id ? parseInt(filters.category_id) : undefined,
        brand_id: filters.brand_id ? parseInt(filters.brand_id) : undefined,
        status: filters.status || undefined,
      });
      setProducts(response.data);
      setTotalPages(response.pagination.total_pages);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiltersData = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        categoryService.getCategories(),
        brandService.getBrands(),
      ]);
      setCategories(categoriesRes.data);
      setBrands(brandsRes.data);
    } catch (error) {
      console.error('Error loading filters data:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleDelete = async () => {
    if (!deleteModal.product) return;

    try {
      await productAdminService.deleteProduct(deleteModal.product.id);
      toast.success('Xóa sản phẩm thành công');
      setDeleteModal({ isOpen: false, product: null });
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Không thể xóa sản phẩm');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const columns = [
    {
      key: 'product',
      title: 'Sản phẩm',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No img
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">{product.category?.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'brand',
      title: 'Thương hiệu',
      render: (product: Product) => product.brand?.name || '-',
    },
    {
      key: 'price',
      title: 'Giá',
      render: (product: Product) => (
        <div>
          <p className="font-medium">{formatCurrency(product.price)}</p>
          {product.sale_price && (
            <p className="text-sm text-red-600">{formatCurrency(product.sale_price)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (product: Product) => <ProductStatusBadge status={product.status} />,
    },
    {
      key: 'sold',
      title: 'Đã bán',
      render: (product: Product) => product.sold_count,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/products/${product.id}`)}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteModal({ isOpen: true, product })}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-500 mt-1">Danh sách tất cả sản phẩm trong hệ thống</p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/admin/products/create')}
        >
          Thêm sản phẩm
        </Button>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <Button type="submit">Tìm kiếm</Button>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Bộ lọc
          </Button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <Select
              label="Danh mục"
              options={[
                { value: '', label: 'Tất cả' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            />
            <Select
              label="Thương hiệu"
              options={[
                { value: '', label: 'Tất cả' },
                ...brands.map((b) => ({ value: b.id, label: b.name })),
              ]}
              value={filters.brand_id}
              onChange={(e) => setFilters({ ...filters, brand_id: e.target.value })}
            />
            <Select
              label="Trạng thái"
              options={[
                { value: '', label: 'Tất cả' },
                { value: 'active', label: 'Đang bán' },
                { value: 'inactive', label: 'Ngừng bán' },
                { value: 'out_of_stock', label: 'Hết hàng' },
              ]}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Products table */}
      <Table columns={columns} data={products} isLoading={isLoading} emptyMessage="Không có sản phẩm nào" />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Delete modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        title="Xác nhận xóa"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa sản phẩm <strong>{deleteModal.product?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, product: null })}
            >
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
