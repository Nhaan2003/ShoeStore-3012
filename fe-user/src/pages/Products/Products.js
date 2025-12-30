import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { productAPI, categoryAPI, brandAPI } from '../../services/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Products.css';

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilter, setShowFilter] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0
    });

    // Filter states
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        brand: searchParams.get('brand') || '',
        gender: searchParams.get('gender') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sortBy: searchParams.get('sortBy') || 'created_at',
        sortOrder: searchParams.get('sortOrder') || 'DESC'
    });

    useEffect(() => {
        fetchFiltersData();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [searchParams]);

    const fetchFiltersData = async () => {
        try {
            const [catRes, brandRes] = await Promise.all([
                categoryAPI.getFlat(),
                brandAPI.getAll()
            ]);
            setCategories(catRes.data.data);
            setBrands(brandRes.data.data);
        } catch (error) {
            console.error('Error fetching filters data:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = Object.fromEntries(searchParams);
            params.page = params.page || 1;
            params.limit = params.limit || 12;
            
            const response = await productAPI.getAll(params);
            setProducts(response.data.data.products);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateFilters = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set('page', '1'); // Reset to page 1 when filter changes
        setSearchParams(newParams);
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setSearchParams({});
        setFilters({
            search: '',
            category: '',
            brand: '',
            gender: '',
            minPrice: '',
            maxPrice: '',
            sortBy: 'created_at',
            sortOrder: 'DESC'
        });
    };

    const handlePageChange = (page) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', page.toString());
        setSearchParams(newParams);
        window.scrollTo(0, 0);
    };

    const priceRanges = [
        { label: 'Dưới 1 triệu', min: 0, max: 1000000 },
        { label: '1 - 2 triệu', min: 1000000, max: 2000000 },
        { label: '2 - 3 triệu', min: 2000000, max: 3000000 },
        { label: '3 - 5 triệu', min: 3000000, max: 5000000 },
        { label: 'Trên 5 triệu', min: 5000000, max: '' }
    ];

    const sortOptions = [
        { label: 'Mới nhất', sortBy: 'created_at', sortOrder: 'DESC' },
        { label: 'Giá: Thấp đến cao', sortBy: 'base_price', sortOrder: 'ASC' },
        { label: 'Giá: Cao đến thấp', sortBy: 'base_price', sortOrder: 'DESC' },
        { label: 'Bán chạy nhất', sortBy: 'sold_count', sortOrder: 'DESC' },
        { label: 'Đánh giá cao', sortBy: 'view_count', sortOrder: 'DESC' }
    ];

    return (
        <div className="products-page">
            <div className="container">
                {/* Breadcrumb */}
                <div className="breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <span>Sản phẩm</span>
                </div>

                <div className="products-container">
                    {/* Filter Sidebar */}
                    <aside className={`filter-sidebar ${showFilter ? 'show' : ''}`}>
                        <div className="filter-header">
                            <h3>Lọc sản phẩm</h3>
                            <button className="close-filter" onClick={() => setShowFilter(false)}>
                                <FiX />
                            </button>
                        </div>

                        {/* Categories */}
                        <div className="filter-group">
                            <h4>Danh mục</h4>
                            <div className="filter-options">
                                {categories.map(cat => (
                                    <label key={cat.id} className="filter-checkbox">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={filters.category === cat.id.toString()}
                                            onChange={() => updateFilters('category', cat.id.toString())}
                                        />
                                        <span>{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Brands */}
                        <div className="filter-group">
                            <h4>Thương hiệu</h4>
                            <div className="filter-options">
                                {brands.map(brand => (
                                    <label key={brand.id} className="filter-checkbox">
                                        <input
                                            type="radio"
                                            name="brand"
                                            checked={filters.brand === brand.id.toString()}
                                            onChange={() => updateFilters('brand', brand.id.toString())}
                                        />
                                        <span>{brand.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="filter-group">
                            <h4>Giới tính</h4>
                            <div className="filter-options">
                                {[
                                    { value: 'male', label: 'Nam' },
                                    { value: 'female', label: 'Nữ' },
                                    { value: 'unisex', label: 'Unisex' }
                                ].map(g => (
                                    <label key={g.value} className="filter-checkbox">
                                        <input
                                            type="radio"
                                            name="gender"
                                            checked={filters.gender === g.value}
                                            onChange={() => updateFilters('gender', g.value)}
                                        />
                                        <span>{g.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="filter-group">
                            <h4>Khoảng giá</h4>
                            <div className="filter-options">
                                {priceRanges.map((range, idx) => (
                                    <label key={idx} className="filter-checkbox">
                                        <input
                                            type="radio"
                                            name="price"
                                            checked={
                                                filters.minPrice === range.min.toString() &&
                                                filters.maxPrice === range.max.toString()
                                            }
                                            onChange={() => {
                                                updateFilters('minPrice', range.min.toString());
                                                updateFilters('maxPrice', range.max.toString());
                                            }}
                                        />
                                        <span>{range.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-secondary btn-block" onClick={clearFilters}>
                            Xóa bộ lọc
                        </button>
                    </aside>

                    {/* Products Area */}
                    <div className="products-area">
                        {/* Header */}
                        <div className="products-header">
                            <div className="products-count">
                                <span>{pagination.total}</span> sản phẩm
                            </div>

                            <div className="products-actions">
                                <button 
                                    className="filter-toggle-btn"
                                    onClick={() => setShowFilter(true)}
                                >
                                    <FiFilter /> Lọc
                                </button>

                                <select
                                    className="sort-select"
                                    value={`${filters.sortBy}-${filters.sortOrder}`}
                                    onChange={(e) => {
                                        const [sortBy, sortOrder] = e.target.value.split('-');
                                        updateFilters('sortBy', sortBy);
                                        updateFilters('sortOrder', sortOrder);
                                    }}
                                >
                                    {sortOptions.map((opt, idx) => (
                                        <option key={idx} value={`${opt.sortBy}-${opt.sortOrder}`}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="no-products">
                                <p>Không tìm thấy sản phẩm nào</p>
                                <button className="btn btn-primary" onClick={clearFilters}>
                                    Xóa bộ lọc
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="products-grid">
                                    {products.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            className="page-btn"
                                            disabled={pagination.page === 1}
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                        >
                                            ‹
                                        </button>
                                        
                                        {[...Array(pagination.totalPages)].map((_, idx) => {
                                            const page = idx + 1;
                                            if (
                                                page === 1 ||
                                                page === pagination.totalPages ||
                                                (page >= pagination.page - 1 && page <= pagination.page + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        className={`page-btn ${pagination.page === page ? 'active' : ''}`}
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                page === pagination.page - 2 ||
                                                page === pagination.page + 2
                                            ) {
                                                return <span key={page} className="page-dots">...</span>;
                                            }
                                            return null;
                                        })}
                                        
                                        <button
                                            className="page-btn"
                                            disabled={pagination.page === pagination.totalPages}
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
