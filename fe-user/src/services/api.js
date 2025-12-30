import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - Add token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                        refreshToken
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/change-password', data)
};

// Product API
export const productAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getRelated: (id) => api.get(`/products/${id}/related`)
};

// Category API
export const categoryAPI = {
    getAll: () => api.get('/categories'),
    getFlat: () => api.get('/categories/flat'),
    getById: (id) => api.get(`/categories/${id}`)
};

// Brand API
export const brandAPI = {
    getAll: () => api.get('/brands'),
    getById: (id) => api.get(`/brands/${id}`)
};

// Cart API
export const cartAPI = {
    get: () => api.get('/cart'),
    getCount: () => api.get('/cart/count'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
    removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
    clear: () => api.delete('/cart')
};

// Order API
export const orderAPI = {
    create: (data) => api.post('/orders', data),
    getMyOrders: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason })
};

// User API
export const userAPI = {
    updateProfile: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.put('/users/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// Review API
export const reviewAPI = {
    getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
    create: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'images' && data[key]) {
                data[key].forEach(file => formData.append('images', file));
            } else {
                formData.append(key, data[key]);
            }
        });
        return api.post('/reviews', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getReviewable: () => api.get('/reviews/reviewable')
};

// Promotion API
export const promotionAPI = {
    getActive: () => api.get('/promotions'),
    verify: (code, orderAmount) => api.post('/promotions/verify', { code, orderAmount })
};

export default api;
