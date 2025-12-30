import api from './api';

export const orderService = {
  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Lấy danh sách đơn hàng của user
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Lấy chi tiết đơn hàng
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Lấy đơn hàng theo mã
  getOrderByCode: async (code) => {
    const response = await api.get(`/orders/code/${code}`);
    return response.data;
  },

  // Hủy đơn hàng
  cancelOrder: async (id, reason) => {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Theo dõi đơn hàng
  trackOrder: async (orderCode) => {
    const response = await api.get(`/orders/track/${orderCode}`);
    return response.data;
  },

  // Xác nhận đã nhận hàng
  confirmDelivery: async (id) => {
    const response = await api.put(`/orders/${id}/confirm-delivery`);
    return response.data;
  },

  // Yêu cầu trả hàng
  requestReturn: async (id, reason) => {
    const response = await api.post(`/orders/${id}/return`, { reason });
    return response.data;
  },
};
