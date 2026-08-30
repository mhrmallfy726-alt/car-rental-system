import api from './api';

export const supplierFinanceAPI = {
  getSummary: () => api.get('/supplier-finance/summary'),
};

export default supplierFinanceAPI;
