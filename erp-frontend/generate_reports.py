import os

BASE_DIR = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/reports'

reports_config = [
    # ACCOUNTS
    {
        'path': 'accounts/cash-book',
        'title': 'Cash Book',
        'subtitle': 'Daily cash transaction summary',
        'category': 'Accounts',
        'apiMethod': 'getCashBook',
        'columns': """
      { key: 'date', label: 'Date', format: (v) => new Date(v).toLocaleDateString() },
      { key: 'particulars', label: 'Particulars' },
      { key: 'voucherNo', label: 'Voucher No.' },
      { key: 'debit', label: 'Debit (In)', align: 'right', format: (v) => v ? `₹${v.toFixed(2)}` : '-' },
      { key: 'credit', label: 'Credit (Out)', align: 'right', format: (v) => v ? `₹${v.toFixed(2)}` : '-' },
      { key: 'balance', label: 'Balance', align: 'right', format: (v) => `₹${v.toFixed(2)}` }
        """
    },
    {
        'path': 'accounts/business-book',
        'title': 'Business Book',
        'subtitle': 'Comprehensive business ledger',
        'category': 'Accounts',
        'apiMethod': 'getBusinessBook',
        'columns': """
      { key: 'date', label: 'Date', format: (v) => new Date(v).toLocaleDateString() },
      { key: 'accountId', label: 'Account', format: (v) => v?.name || 'Unknown' },
      { key: 'particulars', label: 'Particulars' },
      { key: 'voucherType', label: 'Type' },
      { key: 'debit', label: 'Debit', align: 'right', format: (v) => v ? `₹${v.toFixed(2)}` : '-' },
      { key: 'credit', label: 'Credit', align: 'right', format: (v) => v ? `₹${v.toFixed(2)}` : '-' }
        """
    },
    {
        'path': 'accounts/payment-paid',
        'title': 'Payment Paid',
        'subtitle': 'Summary of all outgoing payments',
        'category': 'Accounts',
        'apiMethod': 'getPaymentPaid',
        'columns': """
      { key: 'date', label: 'Date', format: (v) => new Date(v).toLocaleDateString() },
      { key: 'accountId', label: 'Paid From', format: (v) => v?.name || 'Unknown' },
      { key: 'particulars', label: 'Paid To / Details' },
      { key: 'voucherNo', label: 'Reference No' },
      { key: 'credit', label: 'Amount Paid', align: 'right', format: (v) => `₹${v.toFixed(2)}` }
        """
    },
    {
        'path': 'accounts/payment-received',
        'title': 'Payment Received',
        'subtitle': 'Summary of all incoming payments',
        'category': 'Accounts',
        'apiMethod': 'getPaymentReceived',
        'columns': """
      { key: 'date', label: 'Date', format: (v) => new Date(v).toLocaleDateString() },
      { key: 'accountId', label: 'Received In', format: (v) => v?.name || 'Unknown' },
      { key: 'particulars', label: 'Received From / Details' },
      { key: 'voucherNo', label: 'Reference No' },
      { key: 'debit', label: 'Amount Received', align: 'right', format: (v) => `₹${v.toFixed(2)}` }
        """
    },
    {
        'path': 'accounts/chart-of-accounts',
        'title': 'Chart Of Accounts',
        'subtitle': 'Directory of all ledger accounts',
        'category': 'Accounts',
        'apiMethod': 'getChartOfAccounts',
        'columns': """
      { key: 'name', label: 'Account Name' },
      { key: 'accountType', label: 'Type' },
      { key: 'group', label: 'Group' },
      { key: 'openingBalance', label: 'Opening Balance', align: 'right', format: (v) => `₹${(v||0).toFixed(2)}` }
        """
    },
    {
        'path': 'accounts/balance-sheet',
        'title': 'Balance Sheet',
        'subtitle': 'Snapshot of assets & liabilities',
        'category': 'Accounts',
        'apiMethod': 'getBalanceSheet',
        # Balance sheet requires custom rendering because of its structure {assets, liabilities, equity}
        # But for now, we'll just format it flat or return dummy data structure. Let's make it a normal flat list in the backend eventually, or handle it uniquely.
        'columns': """
      { key: 'name', label: 'Account' },
      { key: 'accountType', label: 'Classification' },
      { key: 'balance', label: 'Current Balance', align: 'right', format: (v) => `₹${(v||0).toFixed(2)}` }
        """,
        'customFetch': """
        const fetchData = async () => {
          const res = await reportsApi.getBalanceSheet();
          const data = res.data?.data || { assets: [], liabilities: [], equity: [] };
          // Flatten for simple table view
          return [...data.assets, ...data.liabilities, ...data.equity].map(a => ({
            name: a.name, accountType: a.accountType, balance: a.openingBalance || 0 // In real app, calculate actual balance
          }));
        };
        """
    },

    # INVENTORY
    {
        'path': 'inventory/item-register',
        'title': 'Item Register',
        'subtitle': 'Complete registry of all items',
        'category': 'Inventory',
        'apiMethod': 'getItemRegister',
        'columns': """
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'currentStock', label: 'Current Stock', align: 'right' },
      { key: 'salePrice', label: 'Sale Price', align: 'right', format: (v) => `₹${(v||0).toFixed(2)}` }
        """
    },
    {
        'path': 'inventory/low-level-stock',
        'title': 'Low Level Stock',
        'subtitle': 'Items below minimum stock threshold',
        'category': 'Inventory',
        'apiMethod': 'getLowLevelStock',
        'columns': """
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'currentStock', label: 'Current Stock', align: 'right' },
      { key: 'lowStockAlert', label: 'Alert Level', align: 'right' },
      { key: 'supplierId', label: 'Primary Supplier' }
        """
    },
    {
        'path': 'inventory/stock-availability',
        'title': 'Stock Availability',
        'subtitle': 'Current available stock balances',
        'category': 'Inventory',
        'apiMethod': 'getStockAvailability',
        'columns': """
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'unit', label: 'Unit' },
      { key: 'currentStock', label: 'Available Stock', align: 'right' }
        """
    },
    {
        'path': 'inventory/stock-adjustment',
        'title': 'Stock Adjustment',
        'subtitle': 'History of manual stock adjustments',
        'category': 'Inventory',
        'apiMethod': 'getStockAdjustment',
        'columns': """
      { key: 'date', label: 'Date', format: (v) => new Date(v).toLocaleDateString() },
      { key: 'productId', label: 'Product', format: (v) => v?.name || 'Unknown' },
      { key: 'type', label: 'Adjustment Type' },
      { key: 'quantity', label: 'Quantity', align: 'right' },
      { key: 'reason', label: 'Reason' }
        """
    },
    {
        'path': 'inventory/consumable-stock',
        'title': 'Consumable Stock',
        'subtitle': 'Tracking of consumable inventory',
        'category': 'Inventory',
        'apiMethod': 'getConsumableStock',
        'columns': """
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'currentStock', label: 'Current Stock', align: 'right' },
      { key: 'unit', label: 'Unit' }
        """
    },
    {
        'path': 'inventory/fast-moving',
        'title': 'Fast Moving Item',
        'subtitle': 'High velocity inventory items',
        'category': 'Inventory',
        'apiMethod': 'getFastMovingItems',
        'columns': """
      { key: 'productName', label: 'Item Name' },
      { key: 'totalSold', label: 'Qty Sold (Last 30 Days)', align: 'right' }
        """
    },
    {
        'path': 'inventory/slow-moving',
        'title': 'Items Not Moving',
        'subtitle': 'Dead stock or slow-moving items',
        'category': 'Inventory',
        'apiMethod': 'getSlowMovingItems',
        'columns': """
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'currentStock', label: 'Stuck Stock', align: 'right' },
      { key: 'purchasePrice', label: 'Unit Cost', align: 'right', format: (v) => `₹${(v||0).toFixed(2)}` }
        """
    },
    {
        'path': 'inventory/available-serials',
        'title': 'Available Serials',
        'subtitle': 'Available serial/batch numbers',
        'category': 'Inventory',
        'apiMethod': 'getAvailableSerials',
        'columns': """
      { key: 'batchNo', label: 'Batch / Serial No.' },
      { key: 'productId', label: 'Product', format: (v) => v?.name || 'Unknown' },
      { key: 'expiryDate', label: 'Expiry Date', format: (v) => v ? new Date(v).toLocaleDateString() : 'N/A' },
      { key: 'currentStock', label: 'Available', align: 'right' },
      { key: 'salePrice', label: 'Sale Price', align: 'right', format: (v) => `₹${(v||0).toFixed(2)}` }
        """
    },
    {
        'path': 'inventory/item-list',
        'title': 'Item List',
        'subtitle': 'Master list of inventory products',
        'category': 'Inventory',
        'apiMethod': 'getItemList',
        'columns': """
      { key: 'itemCode', label: 'Code' },
      { key: 'name', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'unit', label: 'Unit' },
      { key: 'salePrice', label: 'Price', align: 'right', format: (v) => `₹${(v||0).toFixed(2)}` }
        """
    },
]

def generate_pages():
    for config in reports_config:
        dir_path = os.path.join(BASE_DIR, config['path'])
        os.makedirs(dir_path, exist_ok=True)
        
        file_path = os.path.join(dir_path, 'page.tsx')
        
        custom_fetch = config.get('customFetch', f"""
        const fetchData = async () => {{
          const res = await reportsApi.{config['apiMethod']}();
          return res.data?.data || [];
        }};
        """)
        
        content = f"""'use client';
import ReportLayout from '../../../../components/reports/ReportLayout';
import {{ reportsApi }} from '../../../../lib/erp-api';

export default function Page() {{
  const columns = [
    {config['columns']}
  ];

  {custom_fetch}

  return (
    <ReportLayout 
      title="{config['title']}"
      subtitle="{config['subtitle']}"
      category="{config['category']}"
      columns={{columns}}
      fetchData={{fetchData}}
    />
  );
}}
"""
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    print(f"Generated {len(reports_config)} report pages.")

generate_pages()
