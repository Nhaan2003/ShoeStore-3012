import { useState } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Select } from '../ui';
import { SORT_OPTIONS, SHOE_SIZES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

const ProductFilter = ({
  categories = [],
  brands = [],
  filters = {},
  onFilterChange,
  onClearFilters,
}) => {
  const [openSections, setOpenSections] = useState({
    category: true,
    brand: true,
    price: true,
    size: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleSizeToggle = (size) => {
    const currentSizes = filters.sizes || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size];
    handleChange('sizes', newSizes);
  };

  const hasActiveFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : !!v
  );

  const priceRanges = [
    { label: 'Dưới 500.000đ', min: 0, max: 500000 },
    { label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
    { label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
    { label: '2.000.000đ - 5.000.000đ', min: 2000000, max: 5000000 },
    { label: 'Trên 5.000.000đ', min: 5000000, max: null },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Sort - Mobile */}
      <div className="lg:hidden mb-4">
        <Select
          label="Sắp xếp"
          options={SORT_OPTIONS}
          value={filters.sort || ''}
          onChange={(e) => handleChange('sort', e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between w-full py-2"
        >
          <span className="font-medium text-gray-900">Danh mục</span>
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform ${
              openSections.category ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.category && (
          <div className="mt-2 space-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  checked={filters.categoryId === category.id}
                  onChange={() => handleChange('categoryId', category.id)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Brand Filter */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('brand')}
          className="flex items-center justify-between w-full py-2"
        >
          <span className="font-medium text-gray-900">Thương hiệu</span>
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform ${
              openSections.brand ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.brand && (
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => (
              <label
                key={brand.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={(filters.brandIds || []).includes(brand.id)}
                  onChange={() => {
                    const currentBrands = filters.brandIds || [];
                    const newBrands = currentBrands.includes(brand.id)
                      ? currentBrands.filter((b) => b !== brand.id)
                      : [...currentBrands, brand.id];
                    handleChange('brandIds', newBrands);
                  }}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{brand.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full py-2"
        >
          <span className="font-medium text-gray-900">Giá</span>
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform ${
              openSections.price ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.price && (
          <div className="mt-2 space-y-2">
            {priceRanges.map((range, index) => (
              <label
                key={index}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={
                    filters.minPrice === range.min &&
                    filters.maxPrice === range.max
                  }
                  onChange={() => {
                    handleChange('minPrice', range.min);
                    handleChange('maxPrice', range.max);
                  }}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Size Filter */}
      <div className="pb-4">
        <button
          onClick={() => toggleSection('size')}
          className="flex items-center justify-between w-full py-2"
        >
          <span className="font-medium text-gray-900">Kích cỡ</span>
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform ${
              openSections.size ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.size && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {SHOE_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeToggle(size)}
                className={`
                  py-2 text-sm font-medium rounded-lg border transition-colors
                  ${
                    (filters.sizes || []).includes(size)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
                  }
                `}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Đang lọc:</p>
          <div className="flex flex-wrap gap-2">
            {filters.categoryId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                {categories.find((c) => c.id === filters.categoryId)?.name}
                <button onClick={() => handleChange('categoryId', null)}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
            {(filters.brandIds || []).map((brandId) => (
              <span
                key={brandId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
              >
                {brands.find((b) => b.id === brandId)?.name}
                <button
                  onClick={() =>
                    handleChange(
                      'brandIds',
                      filters.brandIds.filter((b) => b !== brandId)
                    )
                  }
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                {filters.minPrice ? formatCurrency(filters.minPrice) : '0'} -{' '}
                {filters.maxPrice ? formatCurrency(filters.maxPrice) : '...'}
                <button
                  onClick={() => {
                    handleChange('minPrice', null);
                    handleChange('maxPrice', null);
                  }}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
            {(filters.sizes || []).map((size) => (
              <span
                key={size}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
              >
                Size {size}
                <button onClick={() => handleSizeToggle(size)}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilter;
