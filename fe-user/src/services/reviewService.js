import api from './api';

export const reviewService = {
  // Lấy đánh giá của sản phẩm
  getProductReviews: async (productId, params = {}) => {
    const response = await api.get(`/reviews/product/${productId}`, { params });
    return response.data;
  },

  // Tạo đánh giá mới
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Cập nhật đánh giá
  updateReview: async (id, reviewData) => {
    const response = await api.put(`/reviews/${id}`, reviewData);
    return response.data;
  },

  // Xóa đánh giá
  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  // Lấy đánh giá của user
  getUserReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  // Upload hình ảnh đánh giá
  uploadReviewImages: async (reviewId, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    const response = await api.post(`/reviews/${reviewId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Đánh dấu đánh giá hữu ích
  markHelpful: async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },
};
