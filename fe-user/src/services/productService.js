import api from './api';

export const productService = {
  // Lấy danh sách sản phẩm
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Lấy chi tiết sản phẩm
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Lấy sản phẩm theo slug
  getProductBySlug: async (slug) => {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },

  // Tìm kiếm sản phẩm
  searchProducts: async (query, params = {}) => {
    const response = await api.get('/products/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  // Lấy sản phẩm nổi bật
  getFeaturedProducts: async (limit = 8) => {
    const response = await api.get('/products/featured', {
      params: { limit },
    });
    return response.data;
  },

  // Lấy sản phẩm mới
  getNewProducts: async (limit = 8) => {
    const response = await api.get('/products/new', {
      params: { limit },
    });
    return response.data;
  },

  // Lấy sản phẩm liên quan
  getRelatedProducts: async (productId, limit = 4) => {
    const response = await api.get(`/products/${productId}/related`, {
      params: { limit },
    });
    return response.data;
  },

  // Lấy sản phẩm theo danh mục
  getProductsByCategory: async (categoryId, params = {}) => {
    const response = await api.get(`/products/category/${categoryId}`, { params });
    return response.data;
  },

  // Lấy sản phẩm theo thương hiệu
  getProductsByBrand: async (brandId, params = {}) => {
    const response = await api.get(`/products/brand/${brandId}`, { params });
    return response.data;
  },
};
