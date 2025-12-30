import api from './api';

export const cartService = {
  // Lấy giỏ hàng
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Thêm sản phẩm vào giỏ
  addToCart: async (productId, variantId, quantity = 1) => {
    const response = await api.post('/cart/items', {
      productId,
      variantId,
      quantity,
    });
    return response.data;
  },

  // Cập nhật số lượng
  updateCartItem: async (itemId, quantity) => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  // Xóa sản phẩm khỏi giỏ
  removeFromCart: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  // Xóa toàn bộ giỏ hàng
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },

  // Áp dụng mã giảm giá
  applyCoupon: async (couponCode) => {
    const response = await api.post('/cart/coupon', { code: couponCode });
    return response.data;
  },

  // Xóa mã giảm giá
  removeCoupon: async () => {
    const response = await api.delete('/cart/coupon');
    return response.data;
  },
};
