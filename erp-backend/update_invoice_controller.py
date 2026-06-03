import re

def update_invoice_controller():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/invoice.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Import AccountingService
    if "import { AccountingService }" not in content:
        content = content.replace("import Invoice from '../models/Invoice.model';", "import Invoice from '../models/Invoice.model';\nimport { AccountingService } from '../services/accounting.service';")

    # Add after create
    content = content.replace(
        "res.status(201).json({ message: 'Invoice created', invoice });",
        "// Record in ledger\n    await AccountingService.recordSalesInvoice(invoice);\n\n    res.status(201).json({ message: 'Invoice created', invoice });"
    )

    # Note: What about updateInvoice? If amountReceived changes, we'd need to reverse and re-record, or log an adjustment.
    # For now, let's just reverse and re-record entirely.
    if "await AccountingService.reverseInvoice(invoice);" not in content:
        content = content.replace(
            "await invoice.save();\n      res.json({ message: 'Invoice updated', invoice });",
            "await invoice.save();\n      // Re-record ledger entirely to keep it synced\n      await AccountingService.reverseInvoice(invoice);\n      await AccountingService.recordSalesInvoice(invoice);\n      res.json({ message: 'Invoice updated', invoice });"
        )

    # Note: What about deleteInvoice (cancel)?
    if "invoice.status = 'cancelled';" in content:
        content = content.replace(
            "invoice.status = 'cancelled';\n    await invoice.save();",
            "invoice.status = 'cancelled';\n    await invoice.save();\n    await AccountingService.reverseInvoice(invoice);"
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_invoice_controller()
print("Updated invoice controller!")
