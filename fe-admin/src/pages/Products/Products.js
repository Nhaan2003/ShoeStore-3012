import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch, FiFilter } from 'react-icons/fi';
import { productAPI, categoryAPI, brandAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Products.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        brand: '',
        status: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchFiltersData();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [pagination.page, filters]);

    const fetchFiltersData = async () => {
        try {
            const [catRes, brandRes] = await Promise.all([
                categoryAPI.getFlat(),
                brandAPI.getAll()
            ]);
            setCategories(catRes.data.data);
            setBrands(brandRes.data.data);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                )
            };
            const response = await productAPI.getAll(params);
            setProducts(response.data.data.products);
            setPagination(prev => ({
                ...prev,
                total: response.data.data.pagination.total,
                totalPages: response.data.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) return;
        
        try {
            await productAPI.delete(id);
            toast.success('Xóa sản phẩm thành công');
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            active: { label: 'Đang bán', class: 'success' },
            inactive: { label: 'Tạm ẩn', class: 'secondary' },
            out_of_stock: { label: 'Hết hàng', class: 'danger' }
        };
        const info = statusMap[status] || { label: status, class: 'secondary' };
        return <span className={`badge badge-${info.class}`}>{info.label}</span>;
    };

    return (
        <div className="products-page">
            <div className="page-header">
                <h1 className="page-title">Quản lý sản phẩm</h1>
                <Link to="/products/create" className="btn btn-primary">
                    <FiPlus /> Thêm sản phẩm
                </Link>
            </div>

            {/* Filters */}
            <div className="card filters-card">
                <div className="filters-header">
                    <div className="search-box">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <button 
                        className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FiFilter /> Bộ lọc
                    </button>
                </div>

                {showFilters && (
                    <div className="filters-body">
                        <select 
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        <select 
                            value={filters.brand}
                            onChange={(e) => handleFilterChange('brand', e.target.value)}
                        >
                            <option value="">Tất cả thương hiệu</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>

                        <select 
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Đang bán</option>
                            <option value="inactive">Tạm ẩn</option>
                            <option value="out_of_stock">Hết hàng</option>
                        </select>

                        <button 
                            className="btn btn-secondary"
                            onClick={() => setFilters({ search: '', category: '', brand: '', status: '' })}
                        >
                            Xóa lọc
                        </button>
                    </div>
                )}
            </div>

            {/* Products Table */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <p>Không tìm thấy sản phẩm nào</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Danh mục</th>
                                        <th>Thương hiệu</th>
                                        <th>Giá</th>
                                        <th>Tồn kho</th>
                                        <th>Đã bán</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => (
                                        <tr key={product.id}>
                                            <td>
                                                <div className="product-cell">
                                                    <img 
                                                        src={product.primaryImage ? `${API_URL}${product.primaryImage}` : '/placeholder.png'} 
                                                        alt={product.name}
                                                        className="product-thumb"
                                                    />
                                                    <div>
                                                        <p className="product-name">{product.name}</p>
                                                        <p className="product-sku">ID: {product.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{product.category?.name}</td>
                                            <td>{product.brand?.name}</td>
                                            <td>{formatPrice(product.basePrice)}</td>
                                            <td>{product.totalStock || 0}</td>
                                            <td>{product.soldCount || 0}</td>
                                            <td>{getStatusBadge(product.status)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <Link 
                                                        to={`/products/${product.id}`} 
                                                        className="btn btn-sm btn-secondary"
                                                        title="Xem chi tiết"
                                                    >
                                                        <FiEye />
                                                    </Link>
                                                    <Link 
                                                        to={`/products/${product.id}/edit`} 
                                                        className="btn btn-sm btn-primary"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <FiEdit2 />
                                                    </Link>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        title="Xóa"
                                                        onClick={() => handleDelete(product.id, product.name)}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                ‹
                            </button>
                            {[...Array(pagination.totalPages)].map((_, idx) => (
                                <button
                                    key={idx + 1}
                                    className={pagination.page === idx + 1 ? 'active' : ''}
                                    onClick={() => setPagination(prev => ({ ...prev, page: idx + 1 }))}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                            <button
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                ›
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Products;
