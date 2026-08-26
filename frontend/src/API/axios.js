import axios from 'axios';

// اضبط VITE_API_BASE_URL في .env (مثلاً VITE_API_BASE_URL=http://localhost:5000)
const baseURL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

const api = axios.create({
  baseURL: baseURL + '/api', // يتوافق مع مسارات الباكـاند /api/...
  withCredentials: true // نُفترض استخدام HttpOnly cookies؛ إن لم يكن - استخدم token memory
});

// token in-memory (safer than localStorage).
let accessToken = null;
export const setAccessToken = (token) => { accessToken = token; };
export const clearAccessToken = () => { accessToken = null; };

api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {};
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      clearAccessToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;