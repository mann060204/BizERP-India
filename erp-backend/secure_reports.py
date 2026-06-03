import os

def rewrite_controller():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/reports.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Change `import { Request, Response } from 'express';` to include AuthRequest
    content = content.replace("import { Request, Response } from 'express';", "import { Response } from 'express';\nimport { AuthRequest } from '../middlewares/auth.middleware';")
    
    # 2. Change `req: Request` to `req: AuthRequest`
    content = content.replace("req: Request", "req: AuthRequest")
    
    # 3. For each function, we need to extract businessId and inject it into the queries.
    # We will do this by searching for try { and injecting `const businessId = req.user!.businessId;`
    content = content.replace("try {\n", "try {\n    const businessId = req.user!.businessId;\n")
    
    # Now we must update the queries
    
    # AccountLedger.find({ accountId: ... }) -> AccountLedger.find({ businessId, accountId: ... })
    content = content.replace("AccountLedger.find({ accountId", "AccountLedger.find({ businessId, accountId")
    content = content.replace("AccountLedger.find()", "AccountLedger.find({ businessId })")
    
    # Account.findOne({ accountType: ... }) -> Account.findOne({ businessId, accountType: ... })
    content = content.replace("Account.findOne({ accountType", "Account.findOne({ businessId, accountType")
    content = content.replace("Account.find()", "Account.find({ businessId })")
    content = content.replace("Account.find({ accountType", "Account.find({ businessId, accountType")
    
    # Product.find()
    content = content.replace("Product.find()", "Product.find({ businessId })")
    content = content.replace("Product.find({", "Product.find({ businessId,")
    
    # Batch.find()
    content = content.replace("Batch.find({", "Batch.find({ businessId,")
    
    # InventoryAdjustment.find()
    content = content.replace("InventoryAdjustment.find()", "InventoryAdjustment.find({ businessId })")
    
    # Invoice.distinct(...) -> Invoice.distinct(..., { businessId, ... })
    content = content.replace("Invoice.distinct('items.productId', { date", "Invoice.distinct('items.productId', { businessId, date")
    
    # Invoice.aggregate(pipeline) -> inject $match businessId at the start of pipeline
    content = content.replace('const pipeline: any[] = [\n      { $match: { date: { $gte: thirtyDaysAgo } } },', 'const pipeline: any[] = [\n      { $match: { businessId, date: { $gte: thirtyDaysAgo } } },')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

rewrite_controller()
print("Reports controller updated for multi-tenancy!")
