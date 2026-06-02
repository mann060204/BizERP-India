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
  getPublic: (id: string) => api.get(`/invoices/public/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: string, data: any) => api.put(`/invoices/${id}/status`, data),
  cancel: (id: string) => api.delete(`/invoices/${id}`),
  summary: () => api.get('/invoices/analytics/summary'),
  getNextNumber: (type: 'GST' | 'NON-GST') => api.get('/invoices/next-number', { params: { type } }),
  getLastPrice: (customerId: string, productId: string) => api.get('/invoices/last-price', { params: { customerId, productId } }),
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
export const salesReturnsApi = {
  list: (params?: any) => api.get('/sales-returns', { params }),
  get: (id: string) => api.get(`/sales-returns/${id}`),
  create: (data: any) => api.post('/sales-returns', data),
  update: (id: string, data: any) => api.put(`/sales-returns/${id}`, data),
  delete: (id: string) => api.delete(`/sales-returns/${id}`),
  cancel: (id: string) => api.delete(`/sales-returns/${id}`),
  summary: () => api.get('/sales-returns/analytics/summary'),
  getNextNumber: (type: string) => api.get(`/sales-returns/next-number/${type}`),
};
export const salesReturnApi = salesReturnsApi;

export const purchaseReturnsApi = {
  list: (params?: any) => api.get('/purchase-returns', { params }),
  get: (id: string) => api.get(`/purchase-returns/${id}`),
  create: (data: any) => api.post('/purchase-returns', data),
  update: (id: string, data: any) => api.put(`/purchase-returns/${id}`, data),
  delete: (id: string) => api.delete(`/purchase-returns/${id}`),
  cancel: (id: string) => api.delete(`/purchase-returns/${id}`),
  summary: () => api.get('/purchase-returns/analytics/summary'),
  getNextNumber: (type: string) => api.get(`/purchase-returns/next-number/${type}`),
};
export const purchaseReturnApi = purchaseReturnsApi;

export const purchasesApi = {
  list: (params?: any) => api.get('/purchases', { params }),
  get: (id: string) => api.get(`/purchases/${id}`),
  create: (data: any) => api.post('/purchases', data),
  update: (id: string, data: any) => api.put(`/purchases/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/purchases/${id}/status`, { status }),
  getLastPrices: (supplierId: string, productId: string) => api.get(`/purchases/last-prices?supplierId=${supplierId}&productId=${productId}`),
  cancel: (id: string) => api.delete(`/purchases/${id}`),
  summary: () => api.get('/purchases/analytics/summary'),
};

export const purchaseOrdersApi = {
  list: (params?: any) => api.get('/purchase-orders', { params }).then(res => res.data),
  get: (id: string) => api.get(`/purchase-orders/${id}`).then(res => res.data),
  create: (data: any) => api.post('/purchase-orders', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/purchase-orders/${id}`).then(res => res.data),
  summary: () => api.get('/purchase-orders/analytics/summary').then(res => res.data),
  getNextNumber: () => api.get(`/purchase-orders/next-number`).then(res => res.data),
  convert: (id: string) => api.post(`/purchase-orders/${id}/convert`).then(res => res.data),
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


export const quotationsApi = {
  summary: (params?: any) => api.get('/quotations/summary', { params }).then(res => res.data),
  getAll: (params?: any) => api.get('/quotations', { params }).then(res => res.data),
  getById: (id: string) => api.get(`/quotations/${id}`).then(res => res.data),
  create: (data: any) => api.post('/quotations', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/quotations/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/quotations/${id}`).then(res => res.data),
  getNextNumber: (type?: string) => api.get(`/quotations/next-number${type ? `?type=${type}` : ''}`).then(res => res.data),
  convertToInvoice: (id: string) => api.post(`/quotations/${id}/convert`).then(res => res.data),
};

// ─── Accounts ─────────────────────────────────────────────────────────────────
export const accountsApi = {
  list: (params?: any) => api.get('/accounts', { params }).then(res => res.data),
  create: (data: any) => api.post('/accounts', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/accounts/${id}`, data).then(res => res.data),
  delete: (id: string, force?: boolean) => api.delete(`/accounts/${id}${force ? '?force=true' : ''}`).then(res => res.data),
  getLedger: (id: string, params?: any) => api.get(`/accounts/${id}/ledger`, { params }).then(res => res.data),
  addTransaction: (id: string, data: any) => api.post(`/accounts/${id}/transaction`, data).then(res => res.data),
  deleteTransaction: (id: string, txnId: string) => api.delete(`/accounts/${id}/transaction/${txnId}`).then(res => res.data),
  transfer: (data: any) => api.post(`/accounts/transfer`, data).then(res => res.data),
};

// ─── Banks ────────────────────────────────────────────────────────────────────
export const banksApi = {
  list: (params?: any) => api.get('/banks', { params }).then(res => res.data),
  get: (id: string) => api.get(`/banks/${id}`).then(res => res.data),
  create: (data: any) => api.post('/banks', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/banks/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/banks/${id}`).then(res => res.data),
};

