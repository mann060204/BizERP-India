import re

def add_reports_api():
    filepath = 'd:/ERP WEBSITE/erp-frontend/lib/erp-api.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "export const reportsApi =" in content:
        return
        
    reports_api_code = """
// 📊 Reports
export const reportsApi = {
  // Accounts
  getCashBook: () => api.get('/reports/accounts/cash-book'),
  getBusinessBook: () => api.get('/reports/accounts/business-book'),
  getPaymentPaid: () => api.get('/reports/accounts/payment-paid'),
  getPaymentReceived: () => api.get('/reports/accounts/payment-received'),
  getChartOfAccounts: () => api.get('/reports/accounts/chart-of-accounts'),
  getBalanceSheet: () => api.get('/reports/accounts/balance-sheet'),
  
  // Inventory
  getItemRegister: () => api.get('/reports/inventory/item-register'),
  getLowLevelStock: () => api.get('/reports/inventory/low-level-stock'),
  getStockAvailability: () => api.get('/reports/inventory/stock-availability'),
  getStockAdjustment: () => api.get('/reports/inventory/stock-adjustment'),
  getConsumableStock: () => api.get('/reports/inventory/consumable-stock'),
  getFastMovingItems: () => api.get('/reports/inventory/fast-moving'),
  getSlowMovingItems: () => api.get('/reports/inventory/slow-moving'),
  getAvailableSerials: () => api.get('/reports/inventory/available-serials'),
  getItemList: () => api.get('/reports/inventory/item-list'),
};
"""
    
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write(reports_api_code)

add_reports_api()
print("Added reportsApi to erp-api.ts")
