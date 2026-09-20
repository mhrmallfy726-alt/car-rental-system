import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
const API_ROOT = configuredApiUrl.replace(/\/$/, '').replace(/\/api\/?$/, '');
const branchApi = axios.create({
  baseURL: API_ROOT ? `${API_ROOT}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const branchAuthAPI = {
  login: (data) => branchApi.post('/auth/branch/login', data),
  sendOTP: (data) => branchApi.post('/auth/branch/verification/send-otp', data),
  verifyOTP: (data) => branchApi.post('/auth/branch/verification/verify-otp', data),
};

export default branchAuthAPI;
