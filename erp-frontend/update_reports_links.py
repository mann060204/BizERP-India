import re

def update_page():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/reports/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace disabled: true with disabled: false
    content = content.replace('disabled: true', 'disabled: false')
    
    # We will manually map the hrefs to exactly match what we generated.
    # From generating script: 
    # accounts/cash-book, accounts/business-book, accounts/payment-paid, accounts/payment-received, accounts/chart-of-accounts, accounts/balance-sheet
    # inventory/item-register, inventory/low-level-stock, inventory/stock-availability, inventory/stock-adjustment, inventory/consumable-stock, inventory/fast-moving, inventory/slow-moving, inventory/available-serials, inventory/item-list
    
    mapping = {
        "name: 'Cash Book', desc: 'Daily cash transaction summary', icon: Banknote, href: '#'": "name: 'Cash Book', desc: 'Daily cash transaction summary', icon: Banknote, href: '/dashboard/reports/accounts/cash-book'",
        "name: 'Business Book', desc: 'Comprehensive business ledger', icon: Briefcase, href: '#'": "name: 'Business Book', desc: 'Comprehensive business ledger', icon: Briefcase, href: '/dashboard/reports/accounts/business-book'",
        "name: 'Payment Paid', desc: 'Summary of all outgoing payments', icon: CreditCard, href: '#'": "name: 'Payment Paid', desc: 'Summary of all outgoing payments', icon: CreditCard, href: '/dashboard/reports/accounts/payment-paid'",
        "name: 'Payment - Received', desc: 'Summary of all incoming payments', icon: Download, href: '#'": "name: 'Payment - Received', desc: 'Summary of all incoming payments', icon: Download, href: '/dashboard/reports/accounts/payment-received'",
        "name: 'Chart Of Accounts', desc: 'Directory of all ledger accounts', icon: List, href: '#'": "name: 'Chart Of Accounts', desc: 'Directory of all ledger accounts', icon: List, href: '/dashboard/reports/accounts/chart-of-accounts'",
        "name: 'Balance Sheet', desc: 'Snapshot of assets & liabilities', icon: Scale, href: '#'": "name: 'Balance Sheet', desc: 'Snapshot of assets & liabilities', icon: Scale, href: '/dashboard/reports/accounts/balance-sheet'",
        
        "name: 'Item Register', desc: 'Complete registry of all items', icon: Archive, href: '#'": "name: 'Item Register', desc: 'Complete registry of all items', icon: Archive, href: '/dashboard/reports/inventory/item-register'",
        "name: 'Low Level Stock', desc: 'Items below minimum stock threshold', icon: AlertTriangle, href: '#'": "name: 'Low Level Stock', desc: 'Items below minimum stock threshold', icon: AlertTriangle, href: '/dashboard/reports/inventory/low-level-stock'",
        "name: 'Stock Availability', desc: 'Current available stock balances', icon: CheckCircle, href: '#'": "name: 'Stock Availability', desc: 'Current available stock balances', icon: CheckCircle, href: '/dashboard/reports/inventory/stock-availability'",
        "name: 'Stock Adjustment', desc: 'History of manual stock adjustments', icon: SlidersHorizontal, href: '#'": "name: 'Stock Adjustment', desc: 'History of manual stock adjustments', icon: SlidersHorizontal, href: '/dashboard/reports/inventory/stock-adjustment'",
        "name: 'Consumable Stock', desc: 'Tracking of consumable inventory', icon: BatteryCharging, href: '#'": "name: 'Consumable Stock', desc: 'Tracking of consumable inventory', icon: BatteryCharging, href: '/dashboard/reports/inventory/consumable-stock'",
        "name: 'Fast Moving Item', desc: 'High velocity inventory items', icon: Zap, href: '#'": "name: 'Fast Moving Item', desc: 'High velocity inventory items', icon: Zap, href: '/dashboard/reports/inventory/fast-moving'",
        "name: 'Items Not Moving', desc: 'Dead stock or slow-moving items', icon: Clock, href: '#'": "name: 'Items Not Moving', desc: 'Dead stock or slow-moving items', icon: Clock, href: '/dashboard/reports/inventory/slow-moving'",
        "name: 'Available Serials', desc: 'Available serial/batch numbers', icon: Hash, href: '#'": "name: 'Available Serials', desc: 'Available serial/batch numbers', icon: Hash, href: '/dashboard/reports/inventory/available-serials'",
        "name: 'Item List', desc: 'Master list of inventory products', icon: FileText, href: '#'": "name: 'Item List', desc: 'Master list of inventory products', icon: FileText, href: '/dashboard/reports/inventory/item-list'",
    }
    
    for old, new in mapping.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_page()
print("Links updated in reports center!")
