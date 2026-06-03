import os
import re

def fix_controller():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/reports.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix imports
    content = content.replace("import { AccountLedger } from '../models/AccountLedger.model';", "import AccountLedger from '../models/AccountLedger.model';")
    content = content.replace("import { Account } from '../models/Account.model';", "import Account from '../models/Account.model';")
    content = content.replace("import { Product } from '../models/Product.model';", "import Product from '../models/Product.model';")
    content = content.replace("import { Batch } from '../models/Batch.model';", "import Batch from '../models/Batch.model';")
    content = content.replace("import { InventoryAdjustment } from '../models/InventoryAdjustment.model';", "import InventoryAdjustment from '../models/InventoryAdjustment.model';")
    content = content.replace("import { Invoice } from '../models/Invoice.model';", "import Invoice from '../models/Invoice.model';")

    # Fix any types
    content = re.sub(r'\(a\)\s*=>', '(a: any) =>', content)
    content = re.sub(r'\(i\)\s*=>', '(i: any) =>', content)
    content = re.sub(r'\(b\)\s*=>', '(b: any) =>', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_controller()
print("Fixed reports controller!")
