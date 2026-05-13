import api from './api';

// ─── Customers ────────────────────────────────────────────────────────────────
export const customersApi = {
  list: (params?: any) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  bulkCreate: (data: any) => api.post('/customers/bulk', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  bulkCreate: (data: any) => api.post('/products/bulk', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: (params?: any) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: string, data: any) => api.put(`/invoices/${id}/status`, data),
  cancel: (id: string) => api.delete(`/invoices/${id}`),
  summary: () => api.get('/invoices/analytics/summary'),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliersApi = {
  list: (params?: any) => api.get('/suppliers', { params }),
  get: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// ─── Purchases ────────────────────────────────────────────────────────────────
export const purchasesApi = {
  list: (params?: any) => api.get('/purchases', { params }),
  get: (id: string) => api.get(`/purchases/${id}`),
  create: (data: any) => api.post('/purchases', data),
  updateStatus: (id: string, data: any) => api.put(`/purchases/${id}/status`, data),
  cancel: (id: string) => api.delete(`/purchases/${id}`),
  summary: () => api.get('/purchases/analytics/summary'),
};

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  list: (params?: any) => api.get('/inventory', { params }),
  adjust: (data: any) => api.post('/inventory/adjust', data),
  getAdjustments: () => api.get('/inventory/adjustments'),
};

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expensesApi = {
  list: (params?: any) => api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  summary: () => api.get('/expenses/analytics/summary'),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  pnl: (params?: any) => api.get('/reports/pnl', { params }),
  gstr: (params?: any) => api.get('/reports/gstr', { params }),
  daybook: (params?: any) => api.get('/reports/daybook', { params }),
  dashboardCharts: () => api.get('/reports/dashboard-charts'),
};

// ─── Business / Settings ──────────────────────────────────────────────────────
export const businessApi = {
  getProfile: () => api.get('/business'),
  updateProfile: (data: any) => api.put('/business', data),
};
