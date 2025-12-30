import api from './api';
import {
  DashboardStats,
  SalesChartData,
  TopProduct,
  Product,
  Order,
  User,
  CreateProductInput,
  PaginatedResponse,
  ApiResponse,
} from '../types';

// Dashboard
export const dashboardService = {
  async getStatistics(startDate?: string, endDate?: string): Promise<ApiResponse<DashboardStats>> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.get<ApiResponse<DashboardStats>>(`/admin/statistics?${params}`);
    return response.data;
  },

  async getSalesChart(period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<SalesChartData[]>> {
    const response = await api.get<ApiResponse<SalesChartData[]>>(`/admin/sales-chart?period=${period}`);
    return response.data;
  },

  async getTopProducts(limit: number = 10): Promise<ApiResponse<TopProduct[]>> {
    const response = await api.get<ApiResponse<TopProduct[]>>(`/admin/top-products?limit=${limit}`);
    return response.data;
  },

  async getCustomerStats(): Promise<ApiResponse<{ new_customers: number; returning_customers: number }>> {
    const response = await api.get(`/admin/customer-stats`);
    return response.data;
  },
};

// Product Management
export const productAdminService = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    brand_id?: number;
    status?: string;
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category_id) searchParams.append('category_id', params.category_id.toString());
    if (params?.brand_id) searchParams.append('brand_id', params.brand_id.toString());
    if (params?.status) searchParams.append('status', params.status);

    const response = await api.get<PaginatedResponse<Product>>(`/products?${searchParams}`);
    return response.data;
  },

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: CreateProductInput): Promise<ApiResponse<Product>> {
    const response = await api.post<ApiResponse<Product>>('/admin/products', data);
    return response.data;
  },

  async updateProduct(id: number, data: Partial<CreateProductInput>): Promise<ApiResponse<Product>> {
    const response = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/admin/products/${id}`);
    return response.data;
  },

  async uploadImages(productId: number, images: File[]): Promise<ApiResponse<string[]>> {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    const response = await api.post<ApiResponse<string[]>>(`/admin/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateVariantStock(
    variantId: number,
    data: { stock_quantity: number; adjustment_type: 'set' | 'increase' | 'decrease'; reason: string }
  ): Promise<ApiResponse<null>> {
    const response = await api.put<ApiResponse<null>>(`/admin/products/variants/${variantId}/stock`, data);
    return response.data;
  },

  async bulkUpdate(updates: { id: number; data: Partial<Product> }[]): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>('/admin/products/bulk-update', { updates });
    return response.data;
  },

  async exportProducts(): Promise<Blob> {
    const response = await api.get('/admin/products/export', { responseType: 'blob' });
    return response.data;
  },
};

// Order Management
export const orderAdminService = {
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);

    const response = await api.get<PaginatedResponse<Order>>(`/admin/orders?${searchParams}`);
    return response.data;
  },

  async getOrder(id: number): Promise<ApiResponse<Order>> {
    const response = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return response.data;
  },

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<ApiResponse<Order>> {
    const response = await api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status, notes });
    return response.data;
  },

  async assignStaff(orderId: number, staffId: number): Promise<ApiResponse<Order>> {
    const response = await api.put<ApiResponse<Order>>(`/admin/orders/${orderId}/assign`, { staff_id: staffId });
    return response.data;
  },
};

// User Management
export const userAdminService = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: 'admin' | 'staff' | 'customer';
    status?: 'active' | 'inactive' | 'banned';
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const response = await api.get<PaginatedResponse<User>>(`/admin/users?${searchParams}`);
    return response.data;
  },

  async getUser(id: number): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data;
  },

  async updateUserStatus(id: number, status: 'active' | 'inactive' | 'banned', reason?: string): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${id}/status`, { status, reason });
    return response.data;
  },

  async createStaff(data: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
  }): Promise<ApiResponse<User>> {
    const response = await api.post<ApiResponse<User>>('/admin/users/staff', data);
    return response.data;
  },
};

// Category Management
export const categoryService = {
  async getCategories(params?: { include_children?: boolean; status?: string }): Promise<ApiResponse<import('../types').Category[]>> {
    const searchParams = new URLSearchParams();
    if (params?.include_children) searchParams.append('include_children', 'true');
    if (params?.status) searchParams.append('status', params.status);

    const response = await api.get(`/categories?${searchParams}`);
    return response.data;
  },

  async getCategoryTree(): Promise<ApiResponse<import('../types').Category[]>> {
    const response = await api.get('/categories/tree');
    return response.data;
  },

  async getCategory(id: number): Promise<ApiResponse<import('../types').Category>> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
};

// Brand Management
export const brandService = {
  async getBrands(status?: string): Promise<ApiResponse<import('../types').Brand[]>> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/brands${params}`);
    return response.data;
  },

  async getBrand(id: number): Promise<ApiResponse<import('../types').Brand>> {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },
};
