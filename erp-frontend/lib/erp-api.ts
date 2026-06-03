import api from './api';

// ─── Customers ────────────────────────────────────────────────────────────────
export const customersApi = {
  list: (params?: any) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  bulkCreate: (data: any) => api.post('/customers/bulk', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
    getLedger: (id: string) => api.get(`/customers/${id}/ledger`),
    recordPayment: (id: string, data: any) => api.post(`/customers/${id}/payments`, data),
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
    getLedger: (id: string) => api.get(`/suppliers/${id}/ledger`),
    recordPayment: (id: string, data: any) => api.post(`/suppliers/${id}/payments`, data),
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
  autoSequence: (data: any) => api.post('/inventory/auto-sequence', data).then(res => res.data),
  getBatchAlerts: () => api.get('/inventory/batch-alerts').then(res => res.data),
  getBatchLogs: (params?: any) => api.get('/inventory/batch-logs', { params }).then(res => res.data),
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

  // --- Core ---
  pnl: (params?: any) => api.get('/reports/pnl', { params }),
  gstr: (params?: any) => api.get('/reports/gstr', { params }),
  daybook: (params?: any) => api.get('/reports/daybook', { params }),
  dashboardCharts: () => api.get('/reports/dashboard-charts'),

  // --- Accounts ---
  getCashBook: () => api.get('/reports/accounts/cash-book'),
  getBusinessBook: () => api.get('/reports/accounts/business-book'),
  getPaymentPaid: () => api.get('/reports/accounts/payment-paid'),
  getPaymentReceived: () => api.get('/reports/accounts/payment-received'),
  getChartOfAccounts: () => api.get('/reports/accounts/chart-of-accounts'),
  getBalanceSheet: () => api.get('/reports/accounts/balance-sheet'),

  // --- Inventory ---
  getItemRegister: () => api.get('/reports/inventory/item-register'),
  getLowLevelStock: () => api.get('/reports/inventory/low-level-stock'),
  getStockAvailability: () => api.get('/reports/inventory/stock-availability'),
  getStockAdjustment: () => api.get('/reports/inventory/stock-adjustment'),
  getConsumableStock: () => api.get('/reports/inventory/consumable-stock'),
  getFastMovingItems: () => api.get('/reports/inventory/fast-moving'),
  getSlowMovingItems: () => api.get('/reports/inventory/slow-moving'),
  getAvailableSerials: () => api.get('/reports/inventory/available-serials'),
  getItemList: () => api.get('/reports/inventory/item-list'),

  // --- Sales ---
  getSalesAging: (params?: any) => api.get('/reports/sales/aging', { params }),
  getSalesItemwise: (params?: any) => api.get('/reports/sales/itemwise', { params }),
  getSalesInvoicewise: (params?: any) => api.get('/reports/sales/invoicewise', { params }),
  getInvoicewiseMargin: (params?: any) => api.get('/reports/sales/invoicewise-margin', { params }),
  getItemwiseMargin: (params?: any) => api.get('/reports/sales/itemwise-margin', { params }),
  getCustomerwiseMargin: (params?: any) => api.get('/reports/sales/customerwise-margin', { params }),
  getSalesInvoicewiseSummary: (params?: any) => api.get('/reports/sales/invoicewise-summary', { params }),
  getSalesCustomerwiseSummary: (params?: any) => api.get('/reports/sales/customerwise-summary', { params }),
  getSalesItemwiseSummary: (params?: any) => api.get('/reports/sales/itemwise-summary', { params }),
  getSalesGST: (params?: any) => api.get('/reports/sales/gst', { params }),
  getActiveRecurring: (params?: any) => api.get('/reports/sales/recurring', { params }),

  // --- Customers ---
  getCustomerAmountDue: (params?: any) => api.get('/reports/customers/amount-due', { params }),
  getCustomerPaymentHistory: (params?: any) => api.get('/reports/customers/payment-history', { params }),
  getCustomerAccountBalances: (params?: any) => api.get('/reports/customers/account-balances', { params }),

  // --- Purchases ---
  getPurchaseAging: (params?: any) => api.get('/reports/purchases/aging', { params }),
  getPurchasesBillwise: (params?: any) => api.get('/reports/purchases/billwise', { params }),
  getPurchasesItemwise: (params?: any) => api.get('/reports/purchases/itemwise', { params }),
  getPurchasesBillwiseSummary: (params?: any) => api.get('/reports/purchases/billwise-summary', { params }),
  getPurchasesItemwiseSummary: (params?: any) => api.get('/reports/purchases/itemwise-summary', { params }),
  getPurchasesSupplierwise: (params?: any) => api.get('/reports/purchases/supplierwise-summary', { params }),
  getPurchasesGST: (params?: any) => api.get('/reports/purchases/gst', { params }),

  // --- Suppliers ---
  getSupplierAccountBalances: (params?: any) => api.get('/reports/suppliers/account-balances', { params }),
  getSupplierPaymentHistory: (params?: any) => api.get('/reports/suppliers/payment-history', { params }),

  // --- Expenses ---
  getExpensesSearch: (params?: any) => api.get('/reports/expenses/search', { params }),
  getIndirectExpenses: (params?: any) => api.get('/reports/expenses/indirect', { params }),

  // --- Extended GSTR ---
  getGSTR1: (params?: any) => api.get('/reports/gstr/gstr1', { params }),
  getGSTR3B: (params?: any) => api.get('/reports/gstr/gstr3b', { params }),
};

// ─── Business / Settings ──────────────────────────────────────────────────────
export const businessApi = {
  getProfile: () => api.get('/business'),
  updateProfile: (data: any) => api.put('/business', data),
  updateSequences: (data: any) => api.put('/business/sequences', data).then(res => res.data),
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

// ─── Manufacturing & BOM ──────────────────────────────────────────────────────
export const bomApi = {
  create: (data: any) => api.post('/bom', data),
  getAll: () => api.get('/bom'),
  getById: (id: string) => api.get(`/bom/${id}`),
  update: (id: string, data: any) => api.put(`/bom/${id}`, data),
  delete: (id: string) => api.delete(`/bom/${id}`),
};

export const manufacturingApi = {
  create: (data: any) => api.post('/manufacturing', data),
  createDirect: (data: any) => api.post('/manufacturing/direct', data),
  createReverse: (data: any) => api.post('/manufacturing/reverse', data),
  getPlan: (data: any) => api.post('/manufacturing/plan', data),
  getAll: () => api.get('/manufacturing'),
  updateStatus: (id: string, status: string) => api.put(`/manufacturing/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/manufacturing/${id}`),
};

// ─── Data Management ──────────────────────────────────────────────────────────
export const dataApi = {
  export: () => api.get('/business/data/export').then(res => res.data),
  erase: () => api.delete('/business/data/erase').then(res => res.data),
  import: (data: any) => api.post('/business/data/import', data).then(res => res.data),
};

// ─── Financial Year Management ──────────────────────────────────────────────
export const financialYearApi = {
  startNewYear: (customYearLabel?: string) => api.post('/business/financial-year/start', { customYearLabel }).then(res => res.data),
  getAvailableYears: () => api.get('/business/financial-year/available').then(res => res.data),
  switchYear: (targetBusinessId: string) => api.post('/business/financial-year/switch', { targetBusinessId }).then(res => res.data),
};

// ─── Dashboard Analytics ─────────────────────────────────────────────────────
export const dashboardApi = {
  businessTrend: (params?: any) => api.get('/reports/dashboard/business-trend', { params }).then(res => res.data),
  inventoryVolume: (params?: any) => api.get('/reports/dashboard/inventory-volume', { params }).then(res => res.data),
  topItemsProfit: (params?: any) => api.get('/reports/dashboard/top-items-profit', { params }).then(res => res.data),
  bottomItemsProfit: (params?: any) => api.get('/reports/dashboard/top-items-profit', { params: { ...params, order: 'asc' } }).then(res => res.data),
  stockMovement: (params?: any) => api.get('/reports/dashboard/stock-movement', { params }).then(res => res.data),
  topCustomers: (params?: any) => api.get('/reports/dashboard/top-customers', { params }).then(res => res.data),
  customerPending: () => api.get('/reports/dashboard/customer-pending').then(res => res.data),
};

