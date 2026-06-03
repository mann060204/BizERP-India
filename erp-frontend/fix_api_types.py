import os
import glob
import re

def fix_api():
    filepath = 'd:/ERP WEBSITE/erp-frontend/lib/erp-api.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "getCashBook:" not in content:
        # inject inside reportsApi
        reports_methods = """
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
"""
        content = content.replace("export const reportsApi = {", "export const reportsApi = {\n" + reports_methods)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)


def fix_pages():
    pattern = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/reports/**/*.tsx'
    files = glob.glob(pattern, recursive=True)
    
    for filepath in files:
        if 'page.tsx' in filepath and 'accounts\\' in filepath or 'inventory\\' in filepath or 'accounts/' in filepath or 'inventory/' in filepath:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # cast columns to any[]
            content = content.replace("const columns = [", "const columns: any[] = [")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

fix_api()
fix_pages()
print("Fixed API and casted columns!")
