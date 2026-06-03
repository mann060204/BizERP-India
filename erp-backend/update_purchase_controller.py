import re

def update_purchase_controller():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/purchase.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Import AccountingService
    if "import { AccountingService }" not in content:
        content = content.replace("import PurchaseBill from '../models/PurchaseBill.model';", "import PurchaseBill from '../models/PurchaseBill.model';\nimport { AccountingService } from '../services/accounting.service';")

    # Add after create
    content = content.replace(
        "res.status(201).json({ message: 'Purchase bill created', purchase });",
        "// Record in ledger\n    await AccountingService.recordPurchaseBill(purchase);\n\n    res.status(201).json({ message: 'Purchase bill created', purchase });"
    )

    if "await AccountingService.reversePurchaseBill(purchase);" not in content:
        content = content.replace(
            "await purchase.save();\n      res.json({ message: 'Purchase bill updated', purchase });",
            "await purchase.save();\n      // Re-record ledger entirely to keep it synced\n      await AccountingService.reversePurchaseBill(purchase);\n      await AccountingService.recordPurchaseBill(purchase);\n      res.json({ message: 'Purchase bill updated', purchase });"
        )

    if "purchase.status = 'cancelled';" in content:
        content = content.replace(
            "purchase.status = 'cancelled';\n    await purchase.save();",
            "purchase.status = 'cancelled';\n    await purchase.save();\n    await AccountingService.reversePurchaseBill(purchase);"
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_purchase_controller()
print("Updated purchase controller!")
