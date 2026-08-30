import { api } from './api';

export const supplierContextAPI = {
  getOptions: async () => {
    const response = await api.get('/supplier/context/options');
    return response.data.data || [];
  },
  select: async (location_id) => {
    const response = await api.post('/supplier/context/select', { location_id });
    return response.data;
  },
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
