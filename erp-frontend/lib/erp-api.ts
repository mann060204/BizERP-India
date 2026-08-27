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
    addAdjustment: (id: string, data: any) => api.post(`/customers/${id}/adjustments`, data),
    updateLedgerEntry: (id: string, ledgerId: string, data: any) => api.put(`/customers/${id}/ledger/${ledgerId}`, data),
    deleteLedgerEntry: (id: string, ledgerId: string) => api.delete(`/customers/${id}/ledger/${ledgerId}`),
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
  hardDelete: (id: string) => api.delete(`/invoices/${id}/hard`),
  summary: (params?: any) => api.get('/invoices/analytics/summary', { params }),
  getNextNumber: (type: 'GST' | 'NON-GST') => api.get('/invoices/next-number', { params: { type } }),
  getLastPrice: (customerId: string, productId: string) => api.get('/invoices/last-price', { params: { customerId, productId } }),
};

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliersApi = {
  list: (params?: any) => api.get('/suppliers', { params }),
  get: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  bulkCreate: (data: any) => api.post('/suppliers/bulk', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
    getLedger: (id: string) => api.get(`/suppliers/${id}/ledger`),
    recordPayment: (id: string, data: any) => api.post(`/suppliers/${id}/payments`, data),
    addAdjustment: (id: string, data: any) => api.post(`/suppliers/${id}/adjustments`, data),
    updateLedgerEntry: (id: string, ledgerId: string, data: any) => api.put(`/suppliers/${id}/ledger/${ledgerId}`, data),
    deleteLedgerEntry: (id: string, ledgerId: string) => api.delete(`/suppliers/${id}/ledger/${ledgerId}`),
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
  updateStatus: (id: string, data: any) => api.put(`/purchases/${id}/status`, data),
  getLastPrices: (supplierId: string, productId: string) => api.get(`/purchases/last-prices?supplierId=${supplierId}&productId=${productId}`),
  cancel: (id: string) => api.delete(`/purchases/${id}`),
  hardDelete: (id: string) => api.delete(`/purchases/${id}/hard`),
  summary: (params?: any) => api.get('/purchases/analytics/summary', { params }),
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
  listBatches: (params?: any) => api.get('/inventory/batches', { params }),
  saveBatch: (data: any) => api.post('/inventory/batches', data),
  updateBatch: (id: string, data: any) => api.put(`/inventory/batches/${id}`, data),
  deleteBatch: (id: string) => api.delete(`/inventory/batches/${id}`),
  bulkImport: (data: any) => api.post('/inventory/bulk-import', data),
};

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expensesApi = {
  list: (params?: any) => api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  summary: (params?: any) => api.get('/expenses/analytics/summary', { params }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {

  // --- Core ---
  pnl: (params?: any) => api.get('/reports/pnl', { params }).then(res => res.data),
  gstr: (params?: any) => api.get('/reports/gstr', { params }).then(res => res.data),
  daybook: (params?: any) => api.get('/reports/daybook', { params }).then(res => res.data),
  dashboardCharts: () => api.get('/reports/dashboard-charts').then(res => res.data),

  // --- Accounts ---
  getCashBook: () => api.get('/reports/accounts/cash-book').then(res => res.data),
  getBusinessBook: () => api.get('/reports/accounts/business-book').then(res => res.data),
  getPaymentPaid: () => api.get('/reports/accounts/payment-paid').then(res => res.data),
  getPaymentReceived: () => api.get('/reports/accounts/payment-received').then(res => res.data),
  getChartOfAccounts: () => api.get('/reports/accounts/chart-of-accounts').then(res => res.data),
  getBalanceSheet: () => api.get('/reports/accounts/balance-sheet').then(res => res.data),

  // --- Inventory ---
  getItemRegister: () => api.get('/reports/inventory/item-register').then(res => res.data),
  getLowLevelStock: () => api.get('/reports/inventory/low-level-stock').then(res => res.data),
  getStockAvailability: () => api.get('/reports/inventory/stock-availability').then(res => res.data),
  getStockAdjustment: () => api.get('/reports/inventory/stock-adjustment').then(res => res.data),
  getConsumableStock: () => api.get('/reports/inventory/consumable-stock').then(res => res.data),
  getFastMovingItems: () => api.get('/reports/inventory/fast-moving').then(res => res.data),
  getSlowMovingItems: () => api.get('/reports/inventory/slow-moving').then(res => res.data),
  getAvailableSerials: () => api.get('/reports/inventory/available-serials').then(res => res.data),
  getItemList: () => api.get('/reports/inventory/item-list').then(res => res.data),

  // --- Sales ---
  getSalesAging: (params?: any) => api.get('/reports/sales/aging', { params }).then(res => res.data),
  getSalesItemwise: (params?: any) => api.get('/reports/sales/itemwise', { params }).then(res => res.data),
  getSalesInvoicewise: (params?: any) => api.get('/reports/sales/invoicewise', { params }).then(res => res.data),
  getInvoicewiseMargin: (params?: any) => api.get('/reports/sales/invoicewise-margin', { params }).then(res => res.data),
  getItemwiseMargin: (params?: any) => api.get('/reports/sales/itemwise-margin', { params }).then(res => res.data),
  getCustomerwiseMargin: (params?: any) => api.get('/reports/sales/customerwise-margin', { params }).then(res => res.data),
  getSalesInvoicewiseSummary: (params?: any) => api.get('/reports/sales/invoicewise-summary', { params }).then(res => res.data),
  getSalesCustomerwiseSummary: (params?: any) => api.get('/reports/sales/customerwise-summary', { params }).then(res => res.data),
  getSalesItemwiseSummary: (params?: any) => api.get('/reports/sales/itemwise-summary', { params }).then(res => res.data),
  getSalesGST: (params?: any) => api.get('/reports/sales/gst', { params }).then(res => res.data),
  getActiveRecurring: (params?: any) => api.get('/reports/sales/recurring', { params }).then(res => res.data),

  // --- Customers ---
  getCustomerAmountDue: (params?: any) => api.get('/reports/customers/amount-due', { params }).then(res => res.data),
  getCustomerPaymentHistory: (params?: any) => api.get('/reports/customers/payment-history', { params }).then(res => res.data),
  getCustomerAccountBalances: (params?: any) => api.get('/reports/customers/account-balances', { params }).then(res => res.data),

  // --- Purchases ---
  getPurchaseAging: (params?: any) => api.get('/reports/purchases/aging', { params }).then(res => res.data),
  getPurchasesBillwise: (params?: any) => api.get('/reports/purchases/billwise', { params }).then(res => res.data),
  getPurchasesItemwise: (params?: any) => api.get('/reports/purchases/itemwise', { params }).then(res => res.data),
  getPurchasesBillwiseSummary: (params?: any) => api.get('/reports/purchases/billwise-summary', { params }).then(res => res.data),
  getPurchasesItemwiseSummary: (params?: any) => api.get('/reports/purchases/itemwise-summary', { params }).then(res => res.data),
  getPurchasesSupplierwise: (params?: any) => api.get('/reports/purchases/supplierwise-summary', { params }).then(res => res.data),
  getPurchasesGST: (params?: any) => api.get('/reports/purchases/gst', { params }).then(res => res.data),

  // --- Suppliers ---
  getSupplierAccountBalances: (params?: any) => api.get('/reports/suppliers/account-balances', { params }).then(res => res.data),
  getSupplierPaymentHistory: (params?: any) => api.get('/reports/suppliers/payment-history', { params }).then(res => res.data),

  // --- Expenses ---
  getExpensesSearch: (params?: any) => api.get('/reports/expenses/search', { params }).then(res => res.data),
  getIndirectExpenses: (params?: any) => api.get('/reports/expenses/indirect', { params }).then(res => res.data),

  // --- Extended GSTR ---
  getGSTR1: (params?: any) => api.get('/reports/gstr/gstr1', { params }).then(res => res.data),
  getGSTR3B: (params?: any) => api.get('/reports/gstr/gstr3b', { params }).then(res => res.data),

  // --- ADVANCED FINANCIAL REPORTS ---
  getTrialBalance: () => api.get('/reports/advanced/trial-balance').then(res => res.data),
  getGeneralLedger: () => api.get('/reports/advanced/general-ledger').then(res => res.data),
  getBankBook: () => api.get('/reports/advanced/bank-book').then(res => res.data),
  getBankReconciliation: () => api.get('/reports/advanced/bank-reconciliation').then(res => res.data),
  getCashFlowStatement: () => api.get('/reports/advanced/cash-flow').then(res => res.data),
  getOutstandingReceivables: (params?: any) => api.get('/reports/advanced/outstanding-receivables', { params }).then(res => res.data),
  getOutstandingPayables: (params?: any) => api.get('/reports/advanced/outstanding-payables', { params }).then(res => res.data),

  // --- ADVANCED INVENTORY REPORTS ---
  getInventoryValuation: () => api.get('/reports/advanced/inventory-valuation').then(res => res.data),
  getStockMovement: () => api.get('/reports/advanced/stock-movement').then(res => res.data),
  getWarehouseWiseStock: () => api.get('/reports/advanced/warehouse-stock').then(res => res.data),
  getExpiryItems: () => api.get('/reports/advanced/expiry-items').then(res => res.data),
  getDeadStockAdvanced: () => api.get('/reports/advanced/dead-stock-advanced').then(res => res.data),

  // --- ADVANCED SALES & PURCHASE REPORTS ---
  getSalespersonPerformance: () => api.get('/reports/advanced/salesperson-performance').then(res => res.data),
  getSalesTrend: () => api.get('/reports/advanced/sales-trend').then(res => res.data),
  getTopCustomersAdvanced: () => api.get('/reports/advanced/top-customers-advanced').then(res => res.data),
  getTopSellingProducts: () => api.get('/reports/advanced/top-selling-products').then(res => res.data),
  getSupplierPerformance: () => api.get('/reports/advanced/supplier-performance').then(res => res.data),
  getPurchaseTrend: () => api.get('/reports/advanced/purchase-trend').then(res => res.data),

  // --- COMPLIANCE & MANAGEMENT REPORTS ---
  getGSTAudit: () => api.get('/reports/advanced/gst-audit').then(res => res.data),
  getEInvoiceRegister: () => api.get('/reports/advanced/e-invoice-register').then(res => res.data),
  getEwayBillRegister: () => api.get('/reports/advanced/eway-bill-register').then(res => res.data),
  getBusinessDashboardAdvanced: () => api.get('/reports/advanced/business-dashboard-advanced').then(res => res.data),
  getProfitabilityAnalysis: () => api.get('/reports/advanced/profitability-analysis').then(res => res.data),
  getBudgetVsActual: () => api.get('/reports/advanced/budget-vs-actual').then(res => res.data),
  getAuditTrail: () => api.get('/reports/advanced/audit-trail').then(res => res.data),

  // --- SPECIAL REPORTS ---
  getInventoryWiseCustomerSummary: () => api.get('/reports/special/inventory-wise-customer-summary').then(res => res.data),
  getInventoryWiseSupplierSummary: () => api.get('/reports/special/inventory-wise-supplier-summary').then(res => res.data),
  getSupplierWiseBillSummary: () => api.get('/reports/special/supplier-wise-bill-summary').then(res => res.data),
  getGroupWiseProfitAndLoss: () => api.get('/reports/special/group-wise-profit-loss').then(res => res.data),
  getCategoryWiseSummary: () => api.get('/reports/special/category-wise-summary').then(res => res.data),
  getCategoryWiseProfitAndLoss: () => api.get('/reports/special/category-wise-profit-loss').then(res => res.data),
  getCategoryWiseSales: () => api.get('/reports/special/category-wise-sales').then(res => res.data),
  getCategoryWiseMargin: () => api.get('/reports/special/category-wise-margin').then(res => res.data),
  getCategoryWiseSupplierAnalysis: () => api.get('/reports/special/category-wise-supplier-analysis').then(res => res.data),
  getAbcAnalysis: () => api.get('/reports/special/abc-analysis').then(res => res.data),
  getInventoryTurnoverRatio: () => api.get('/reports/special/inventory-turnover-ratio').then(res => res.data),
  getGrossProfitPct: () => api.get('/reports/special/gross-profit-pct').then(res => res.data),
  getNetProfitPct: () => api.get('/reports/special/net-profit-pct').then(res => res.data),
  getCustomerLifetimeValue: () => api.get('/reports/special/customer-lifetime-value').then(res => res.data),
  getRepeatCustomerReport: () => api.get('/reports/special/repeat-customer-report').then(res => res.data),
  getTop100Products: () => api.get('/reports/special/top-100-products').then(res => res.data),
  getBottom100Products: () => api.get('/reports/special/bottom-100-products').then(res => res.data),
  getSeasonalAnalysis: () => api.get('/reports/special/seasonal-analysis').then(res => res.data),
  getDeadStockRecovery: () => api.get('/reports/special/dead-stock-recovery').then(res => res.data),
  getForecastPurchasePlanning: () => api.get('/reports/special/forecast-purchase-planning').then(res => res.data),
  getForecastSalesPlanning: () => api.get('/reports/special/forecast-sales-planning').then(res => res.data),
  
  getCityWiseCustomerReport: () => api.get('/reports/special/city-wise-customer-report').then(res => res.data),
  getCustomerLedgerReport: () => api.get('/reports/special/customer-ledger-report').then(res => res.data),
  getCustomerPurchaseFrequency: () => api.get('/reports/special/customer-purchase-frequency').then(res => res.data),
  getTop50Customers: () => api.get('/reports/special/top-50-customers').then(res => res.data),
  getCustomerWiseItemSales: () => api.get('/reports/special/customer-wise-item-sales').then(res => res.data),
  getSupplierLedgerReport: () => api.get('/reports/special/supplier-ledger-report').then(res => res.data),
  getSpecialSupplierPaymentHistory: () => api.get('/reports/special/supplier-payment-history').then(res => res.data),
  getSupplierWisePurchase: () => api.get('/reports/special/supplier-wise-purchase').then(res => res.data),
  getSupplierRateComparison: () => api.get('/reports/special/supplier-rate-comparison').then(res => res.data),
  getSupplierItemHistory: () => api.get('/reports/special/supplier-item-history').then(res => res.data),
  getTopSuppliers: () => api.get('/reports/special/top-suppliers').then(res => res.data),
  getPurchaseReturnReport: () => api.get('/reports/special/purchase-return-report').then(res => res.data),
  getPurchaseSummaryReport: () => api.get('/reports/special/purchase-summary-report').then(res => res.data),
  getItemWiseProfit: () => api.get('/reports/special/item-wise-profit').then(res => res.data),
  getCategoryWiseProfit: () => api.get('/reports/special/category-wise-profit').then(res => res.data),
  getCustomerWiseProfit: () => api.get('/reports/special/customer-wise-profit').then(res => res.data),
  getSupplierWiseProfit: () => api.get('/reports/special/supplier-wise-profit').then(res => res.data),
  getInvoiceWiseProfit: () => api.get('/reports/special/invoice-wise-profit').then(res => res.data),
  getBrandWiseProfit: () => api.get('/reports/special/brand-wise-profit').then(res => res.data),

  // --- DISCOUNT IMPACT & CASH INVOICE (NEW) ---
  getDiscountImpact: (params?: any) => api.get('/reports/advanced/discount-impact', { params }).then(res => res.data),
  getCashInvoiceReport: (params?: any) => api.get('/reports/sales/cash-invoice', { params }).then(res => res.data),
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
  getByProduct: (productId: string) => api.get(`/bom/product/${productId}`),
  saveForProduct: (productId: string, data: any) => api.post(`/bom/product/${productId}`, data),
  update: (id: string, data: any) => api.put(`/bom/${id}`, data),
  delete: (id: string) => api.delete(`/bom/${id}`),
};

export const manufacturingApi = {
  create: (data: any) => api.post('/manufacturing', data),
  preview: (data: any) => api.post('/manufacturing/preview', data),
  createDirect: (data: any) => api.post('/manufacturing/direct', data),
  createReverse: (data: any) => api.post('/manufacturing/reverse', data),
  getPlan: (data: any) => api.post('/manufacturing/plan', data),
  getAll: () => api.get('/manufacturing'),
  getById: (id: string) => api.get(`/manufacturing/${id}`),
  confirm: (id: string) => api.post(`/manufacturing/${id}/confirm`),
  cancel: (id: string) => api.post(`/manufacturing/${id}/cancel`),
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
  startNewYear: (data: { customYearLabel?: string, carryForwardStock?: boolean, carryForwardCustomerBalances?: boolean, carryForwardSupplierBalances?: boolean, carryForwardBankBalances?: boolean, lockPreviousFY?: boolean, isHistorical?: boolean, copyCustomers?: boolean, copySuppliers?: boolean, copyProducts?: boolean }) => api.post('/business/financial-year/start', data).then(res => res.data),
  getAvailableYears: () => api.get('/business/financial-year/available').then(res => res.data),
  switchYear: (targetBusinessId: string) => api.post('/business/financial-year/switch', { targetBusinessId }).then(res => res.data),
  deleteYear: (id: string) => api.delete('/business/financial-year/' + id).then(res => res.data),
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
  supplierPending: () => api.get('/reports/dashboard/supplier-pending').then(res => res.data),
  todayActivity: (params?: any) => api.get('/reports/dashboard/today-activity', { params }).then(res => res.data),
  dailyTransactions: (params?: any) => api.get('/reports/dashboard/daily-transactions', { params }).then(res => res.data),
  reconciliation: () => api.get('/reports/admin/reconciliation').then(res => res.data),
};

// ─── Payment Modes ────────────────────────────────────────────────────────────
export const paymentModesApi = {
  list: () => api.get('/payment-modes'),
  resolve: (mode: string) => api.get('/payment-modes/resolve', { params: { mode } }),
  create: (data: any) => api.post('/payment-modes', data),
  update: (id: string, data: any) => api.put(`/payment-modes/${id}`, data),
  delete: (id: string) => api.delete(`/payment-modes/${id}`),
};

export const discountSchemesApi = {
  list: () => api.get('/discount-schemes'),
  getById: (id: string) => api.get(`/discount-schemes/${id}`),
  create: (data: any) => api.post('/discount-schemes', data),
  update: (id: string, data: any) => api.put(`/discount-schemes/${id}`, data),
  updateStatus: (id: string, status: string) => api.put(`/discount-schemes/${id}/status`, { status }),
  calculate: (data: any) => api.post('/discount-schemes/calculate', data),
};
