import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle 401
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

// ── Auth ──────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  uploadDocs: (data) => api.post('/auth/upload-documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  uploadBrandLogo: (data) => api.post('/auth/upload-brand-logo', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ── Cars ──────────────────────────────────────
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

// ── Reservations ──────────────────────────────
export const reservationsAPI = {
  create: (data) => api.post('/reservations', data),
  getMy: () => api.get('/reservations/my'),
  getOne: (id) => api.get(`/reservations/${id}`),
  approve: (id) => api.put(`/reservations/${id}/approve`),
  reject: (id, data) => api.put(`/reservations/${id}/reject`, data),
  cancel: (id, data) => api.put(`/reservations/${id}/cancel`, data),
  complete: (id) => api.put(`/reservations/${id}/complete`),
};

// ── Payments ──────────────────────────────────
export const paymentsAPI = {
  checkout: (data) => api.post('/payments/checkout', data),
  getHistory: () => api.get('/payments/history'),
  getSavedCards: () => api.get('/payments/cards'),
  saveCard: (data) => api.post('/payments/cards', data),
};

// ── Reviews ───────────────────────────────────
export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  getForCar: (carId) => api.get(`/reviews/car/${carId}`),
};

// ── Complaints / Chat & Disputes ──────────────
export const complaintsAPI = {
  // إنشاء شكوى أو محادثة
  create: (data) => api.post('/complaints', data),

  // جلب جميع المحادثات/الشكاوى للمستخدم الحالي
  getMy: () => api.get('/complaints/my'),

  // جلب شكوى/محادثة واحدة
  getOne: (id) => api.get(`/complaints/${id}`),

  // إرسال رسالة نصية فقط (بدون مرفق)
  sendMessage: (id, data) => api.post(`/complaints/${id}/message`, data),

  // إرسال رسالة مع مرفق (باستخدام FormData)
  sendMessageWithAttachment: (id, formData) =>
    api.post(`/complaints/${id}/message`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // جلب جميع رسائل محادثة معينة
  getMessages: (id) => api.get(`/complaints/${id}/messages`),
};

// ── Notifications ─────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ── Handover ──────────────────────────────────
export const handoverAPI = {
  submit: (reservationId, type, data) =>
    api.post(`/handover/${reservationId}/${type}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getLogs: (reservationId) => api.get(`/handover/${reservationId}`),
};

// ── Admin ─────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  getCars: () => api.get('/admin/cars'),
  verifyUser: (id) => api.put(`/admin/users/${id}/verify`),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle-active`),
  approveCar: (id) => api.put(`/admin/cars/${id}/approve`),
  getComplaints: () => api.get('/admin/complaints'),
  getReservations: () => api.get('/admin/reservations'),
  // حل شكوى/نزاع (نفس المسار المستخدم في الخادم)
  resolveComplaint: (id, data) => api.put(`/complaints/${id}/resolve`, data),
  // جلب مستخدم واحد (اختياري)
  getUser: (id) => api.get(`/admin/users/${id}`),
};

export default api;