import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
const API_ROOT = configuredApiUrl.replace(/\/$/, '').replace(/\/api\/?$/, '');
const branchApi = axios.create({
  baseURL: API_ROOT ? `${API_ROOT}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

const authConfig = (token) => token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

export const branchAuthAPI = {
  login: (data) => branchApi.post('/auth/branch/login', data),
  sendOTP: (token) => branchApi.post('/auth/branch/verification/send-otp', {}, authConfig(token)),
  verifyOTP: (token, data) => branchApi.post('/auth/branch/verification/verify-otp', data, authConfig(token)),
  changeFirstPassword: (token, data) => branchApi.post('/auth/branch/password/change-first-login', data, authConfig(token)),
};

export default branchAuthAPI;
