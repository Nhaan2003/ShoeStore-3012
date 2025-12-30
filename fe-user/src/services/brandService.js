import api from './api';

export const brandService = {
  // Lấy tất cả thương hiệu
  getBrands: async () => {
    const response = await api.get('/brands');
    return response.data;
  },

  // Lấy thương hiệu theo ID
  getBrandById: async (id) => {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },

  // Lấy thương hiệu nổi bật
  getFeaturedBrands: async (limit = 6) => {
    const response = await api.get('/brands/featured', {
      params: { limit },
    });
    return response.data;
  },
};
