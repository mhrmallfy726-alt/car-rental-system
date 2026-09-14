const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL
  || import.meta.env.VITE_API_URL
  || import.meta.env.VITE_BACKEND_URL
  || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
const SOCKET_URL = configuredSocketUrl
  .replace(/\/$/, '')
  .replace(/\/api\/?$/, '');

export default SOCKET_URL;
