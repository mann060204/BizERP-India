import re

def update_account_ledger():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/models/AccountLedger.model.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make accountId optional and add customerId, supplierId
    content = content.replace('accountId: mongoose.Types.ObjectId;', 'accountId?: mongoose.Types.ObjectId;\n  customerId?: mongoose.Types.ObjectId;\n  supplierId?: mongoose.Types.ObjectId;')
    content = content.replace("accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },", "accountId: { type: Schema.Types.ObjectId, ref: 'Account' },\n    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },\n    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def update_customer():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/models/Customer.model.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'currentBalance: number;' not in content:
        content = content.replace('openingBalance: number;', 'openingBalance: number;\n  currentBalance: number;')
        content = content.replace("openingBalance: { type: Number, default: 0 },", "openingBalance: { type: Number, default: 0 },\n    currentBalance: { type: Number, default: 0 },")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

def update_supplier():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/models/Supplier.model.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'currentBalance: number;' not in content:
        content = content.replace('openingBalance: number;', 'openingBalance: number;\n  currentBalance: number;')
        content = content.replace("openingBalance: { type: Number, default: 0 },", "openingBalance: { type: Number, default: 0 },\n    currentBalance: { type: Number, default: 0 },")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

update_account_ledger()
update_customer()
update_supplier()
print("Updated models!")
