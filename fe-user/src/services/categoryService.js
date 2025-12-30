import api from './api';

export const categoryService = {
  // Lấy tất cả danh mục
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Lấy danh mục theo ID
  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Lấy cây danh mục (hierarchical)
  getCategoryTree: async () => {
    const response = await api.get('/categories/tree');
    return response.data;
  },

  // Lấy danh mục con
  getSubcategories: async (parentId) => {
    const response = await api.get(`/categories/${parentId}/subcategories`);
    return response.data;
  },
};
