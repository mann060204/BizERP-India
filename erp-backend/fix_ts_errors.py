import os

def fix_ts_errors():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/reports.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('const pipeline = [', 'const pipeline: any[] = [')
    content = content.replace('Product.find({ _id: { $nin: activeProductIds as any[] }, currentStock: { $gt: 0 } })', 'Product.find({ _id: { $nin: activeProductIds as any[] }, currentStock: { $gt: 0 } } as any)')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_ts_errors()
print("Fixed ts errors!")
