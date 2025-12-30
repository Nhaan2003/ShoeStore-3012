import api from './api';
import { Order, PaginatedResponse, ApiResponse } from '../types';

export const staffOrderService = {
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const response = await api.get<PaginatedResponse<Order>>(`/staff/orders?${searchParams}`);
    return response.data;
  },

  async getOrder(id: number): Promise<ApiResponse<Order>> {
    const response = await api.get<ApiResponse<Order>>(`/staff/orders/${id}`);
    return response.data;
  },

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<ApiResponse<Order>> {
    const response = await api.put<ApiResponse<Order>>(`/staff/orders/${id}/status`, { status, notes });
    return response.data;
  },

  async cancelOrder(id: number, reason: string): Promise<ApiResponse<Order>> {
    const response = await api.post<ApiResponse<Order>>(`/staff/orders/${id}/cancel`, { reason });
    return response.data;
  },

  async addOrderNote(id: number, note: string): Promise<ApiResponse<Order>> {
    const response = await api.post<ApiResponse<Order>>(`/staff/orders/${id}/notes`, { note });
    return response.data;
  },

  async getStats(): Promise<ApiResponse<{
    total_orders: number;
    pending_orders: number;
    processing_orders: number;
    completed_orders: number;
  }>> {
    const response = await api.get('/staff/stats');
    return response.data;
  },
};
