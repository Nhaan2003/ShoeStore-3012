import api from './api';

export const userService = {
  // Lấy thông tin profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Cập nhật profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Lấy danh sách địa chỉ
  getAddresses: async () => {
    const response = await api.get('/users/addresses');
    return response.data;
  },

  // Thêm địa chỉ mới
  addAddress: async (addressData) => {
    const response = await api.post('/users/addresses', addressData);
    return response.data;
  },

  // Cập nhật địa chỉ
  updateAddress: async (id, addressData) => {
    const response = await api.put(`/users/addresses/${id}`, addressData);
    return response.data;
  },

  // Xóa địa chỉ
  deleteAddress: async (id) => {
    const response = await api.delete(`/users/addresses/${id}`);
    return response.data;
  },

  // Đặt địa chỉ mặc định
  setDefaultAddress: async (id) => {
    const response = await api.put(`/users/addresses/${id}/default`);
    return response.data;
  },

  // Lấy danh sách yêu thích
  getWishlist: async () => {
    const response = await api.get('/users/wishlist');
    return response.data;
  },

  // Thêm vào yêu thích
  addToWishlist: async (productId) => {
    const response = await api.post('/users/wishlist', { productId });
    return response.data;
  },

  // Xóa khỏi yêu thích
  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/users/wishlist/${productId}`);
    return response.data;
  },
};
