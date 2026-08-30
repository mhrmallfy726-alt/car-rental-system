import axios from 'axios';

const API_ROOT = (import.meta.env.VITE_API_URL || '')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

export const api = axios.create({
  baseURL: API_ROOT ? `${API_ROOT}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  requestPasswordReset: (data) => api.post('/auth/forgot-password', data),
  verifyPasswordReset: (data) => api.post('/auth/forgot-password/verify', data),
  resetPassword: (data) => api.post('/auth/forgot-password/reset', data),
  getMe: () => api.get('/auth/me'),
  uploadDocs: (data) => api.post('/auth/upload-documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  uploadBrandLogo: (data) => api.post('/auth/upload-brand-logo', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const carsAPI = {
  getAll: (params) => api.get('/cars', { params }),
  getOne: (id) => api.get(`/cars/${id}`),
  create: (data) => api.post('/cars', data),
  update: (id, data) => api.put(`/cars/${id}`, data),
  delete: (id) => api.delete(`/cars/${id}`),
  getMyCars: () => api.get('/cars/my/list'),
  getCategories: () => api.get('/cars/categories/list'),
  getLocations: () => api.get('/cars/locations/list'),
  getFavorites: () => api.get('/cars/my/favorites'),
  toggleFavorite: (id) => api.post(`/cars/${id}/favorite`),
};

export const reservationsAPI = {
  create: (data) => api.post('/reservations', data),
  getMy: () => api.get('/reservations/my'),
  getOne: (id) => api.get(`/reservations/${id}`),
  approve: (id) => api.put(`/reservations/${id}/approve`),
  reject: (id, data) => api.put(`/reservations/${id}/reject`, data),
  cancel: (id, data) => api.put(`/reservations/${id}/cancel`, data),
  complete: (id) => api.put(`/reservations/${id}/complete`),
};

export const paymentsAPI = {
  getCurrencies: () => api.get('/payments/currencies'),
  checkout: (data) => api.post('/payments/checkout', data),
  advertisementCheckout: (data) => api.post('/payments/advertisement-checkout', data),
  getHistory: () => api.get('/payments/history'),
  getSavedCards: () => api.get('/payments/cards'),
  saveCard: (data) => api.post('/payments/cards', data),
};

export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  getForCar: (carId) => api.get(`/reviews/car/${carId}`),
};

export const complaintsAPI = {
  create: (data) => api.post('/complaints', data),
  getMy: () => api.get('/complaints/my'),
  getOne: (id) => api.get(`/complaints/${id}`),
  sendMessage: (id, data) => api.post(`/complaints/${id}/message`, data),
  sendMessageWithAttachment: (id, formData) => api.post(`/complaints/${id}/message`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMessages: (id) => api.get(`/complaints/${id}/messages`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getOne: (id) => api.get(`/notifications/${id}`),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const whatsappAPI = {
  getStatus: () => api.get('/whatsapp/status'),
  sendTest: (data) => api.post('/whatsapp/test', data),
};

export const handoverAPI = {
  submit: (reservationId, type, data) => api.post(`/handover/${reservationId}/${type}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getLogs: (reservationId) => api.get(`/handover/${reservationId}`),
  reviewBefore: (reservationId, formData) => api.post(`/handover/${reservationId}/before/review`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  decideDispute: (reservationId, stage, verificationId, data) => api.put(`/handover/${reservationId}/${stage}/${verificationId}/decision`, data),
};

export const financeAPI = {
  getDashboard: () => api.get('/finance/dashboard'),
  getSettings: () => api.get('/finance/settings'),
  updateSettings: (data) => api.put('/finance/settings', data),
  createPayout: (data) => api.post('/finance/payouts', data),
  completePayout: (id, data = {}) => api.put(`/finance/payouts/${id}/complete`, data),
};

export const supplierFinanceAPI = {
  getSummary: () => api.get('/supplier-finance/summary'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  getCars: () => api.get('/admin/cars'),
  verifyUser: (id) => api.put(`/admin/users/${id}/verify`),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle-active`),
  approveCar: (id) => api.put(`/admin/cars/${id}/approve`),
  getComplaints: () => api.get('/admin/complaints'),
  getReservations: () => api.get('/admin/reservations'),
  resolveComplaint: (id, data) => api.put(`/complaints/${id}/resolve`, data),
  getUser: (id) => api.get(`/admin/users/${id}`),
  getAdvertisements: () => api.get('/advertisementController/admin/all'),
  getAdvertisementRequests: () => api.get('/advertisementController/admin/requests'),
  getAdvertisementStats: () => api.get('/advertisementController/admin/stats'),
  getSuppliers: (params) => api.get('/advertisementController/suppliers', { params }),
  getSupplierCars: (id) => api.get(`/advertisementController/suppliers/${id}/cars`),
  createAdvertisement: (formData) => api.post('/advertisementController', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateAdvertisement: (id, formData) => api.put(`/advertisementController/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAdvertisement: (id) => api.delete(`/advertisementController/${id}`),
  approveAdvertisement: (id) => api.put(`/advertisementController/admin/requests/${id}/approve`),
  rejectAdvertisement: (id, data) => api.put(`/advertisementController/admin/requests/${id}/reject`, data),
  getSupplierRequests: () => api.get('/admin/supplier-requests'),
  approveSupplier: (id) => api.put(`/admin/supplier-requests/${id}/approve`),
  rejectSupplier: (id, reason) => api.put(`/admin/supplier-requests/${id}/reject`, { reason }),
};

export const advertisementsAPI = {
  getPricing: () => api.get('/advertisementController/pricing'),
  getActiveAdvertisements: (params = {}) => api.get('/advertisementController/active', { params }),
  recordImpression: (id) => api.post(`/advertisementController/${id}/impression`),
  recordClick: (id) => api.post(`/advertisementController/${id}/click`),
  getMyRequests: () => api.get('/advertisementController/requests/mine'),
  createRequest: (formData) => api.post('/advertisementController/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default api;
