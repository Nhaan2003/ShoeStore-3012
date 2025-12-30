import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('adminRefreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('adminToken', accessToken);
                    localStorage.setItem('adminRefreshToken', newRefreshToken);
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/admin/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/change-password', data)
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getRevenue: (params) => api.get('/dashboard/revenue', { params }),
    getTopProducts: (params) => api.get('/dashboard/top-products', { params }),
    getRecentOrders: (params) => api.get('/dashboard/recent-orders', { params }),
    getLowStock: (params) => api.get('/dashboard/low-stock', { params }),
    getOrderStats: () => api.get('/dashboard/order-stats')
};

// Product API
export const productAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'images' && data[key]) {
                data[key].forEach(file => formData.append('images', file));
            } else if (key === 'variants') {
                formData.append(key, JSON.stringify(data[key]));
            } else if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    addVariant: (id, data) => api.post(`/products/${id}/variants`, data),
    uploadImages: (id, files) => {
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        return api.post(`/products/${id}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// Category API
export const categoryAPI = {
    getAll: () => api.get('/categories'),
    getFlat: () => api.get('/categories/flat'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/categories', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    update: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/categories/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: (id) => api.delete(`/categories/${id}`)
};

// Brand API
export const brandAPI = {
    getAll: () => api.get('/brands'),
    getById: (id) => api.get(`/brands/${id}`),
    create: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/brands', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    update: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/brands/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: (id) => api.delete(`/brands/${id}`)
};

// Order API
export const orderAPI = {
    getAll: (params) => api.get('/orders/admin/all', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    updateStatus: (id, data) => api.put(`/orders/${id}/status`, data)
};

// User API
export const userAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    createStaff: (data) => api.post('/users/staff', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    toggleStatus: (id) => api.put(`/users/${id}/status`),
    resetPassword: (id) => api.put(`/users/${id}/reset-password`),
    getOrders: (id, params) => api.get(`/users/${id}/orders`, { params })
};

// Review API
export const reviewAPI = {
    getAll: (params) => api.get('/reviews/admin', { params }),
    updateStatus: (id, data) => api.put(`/reviews/${id}/status`, data),
    reply: (id, data) => api.put(`/reviews/${id}/reply`, data)
};

// Promotion API
export const promotionAPI = {
    getAll: (params) => api.get('/promotions/admin', { params }),
    create: (data) => api.post('/promotions', data),
    update: (id, data) => api.put(`/promotions/${id}`, data),
    delete: (id) => api.delete(`/promotions/${id}`)
};

export default api;
