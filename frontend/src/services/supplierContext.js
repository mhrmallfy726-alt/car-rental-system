const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'حدث خطأ');
  return data;
}

export const supplierContextAPI = {
  getOptions: () => request('/supplier/context/options'),
  select: (location_id) => request('/supplier/context/select', {
    method: 'POST',
    body: JSON.stringify({ location_id }),
  }),
};

export function getSelectedShowroom() {
  try {
    return JSON.parse(localStorage.getItem('supplierShowroom') || 'null');
  } catch {
    return null;
  }
}

export function setSelectedShowroom(showroom) {
  localStorage.setItem('supplierShowroom', JSON.stringify(showroom));
}

export function clearSelectedShowroom() {
  localStorage.removeItem('supplierShowroom');
}
