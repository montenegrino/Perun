import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(error.config);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  getMe: () => api.get('/auth/me')
};

// Wallet API
export const walletApi = {
  getWallets: () => api.get('/wallets'),
  sendTokens: (data: any) => api.post('/wallets/send', data),
  getTransactions: (params?: any) => api.get('/wallets/transactions', { params })
};

// Pricing API
export const pricingApi = {
  getCurrentPrices: (currency = 'EUR') => api.get('/pricing', { params: { currency } })
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  approveUser: (id: string) => api.post(`/admin/users/${id}/approve`),
  rejectUser: (id: string) => api.post(`/admin/users/${id}/reject`),
  suspendUser: (id: string) => api.post(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
  adjustBalance: (id: string, data: any) => api.post(`/admin/users/${id}/adjust-balance`, data),
  getTransactions: (params?: any) => api.get('/admin/transactions', { params }),
  mintTokens: (data: any) => api.post('/admin/tokens/mint', data),
  setPrice: (data: any) => api.post('/admin/tokens/price', data),
  getAuditLogs: (params?: any) => api.get('/admin/audit', { params })
};
