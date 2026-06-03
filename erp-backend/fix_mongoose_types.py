import os

def fix_mongoose_types():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/reports.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Cast aggregate array to any[]
    content = content.replace("await Invoice.aggregate([", "await Invoice.aggregate([\n")
    # Actually, simpler to just replace "Invoice.aggregate([" with "Invoice.aggregate([ ... ] as any[])"
    # But since it's multi-line, let's just do a regex
    import re
    
    # 1. Cast aggregate
    # The aggregate has [{ $match... }, ... { $limit: 10 }]
    content = re.sub(r'await Invoice.aggregate\(\[([^\]]+)\]\);', r'await Invoice.aggregate([\1] as any[]);', content, flags=re.DOTALL)
    
    # 2. Cast activeProductIds to string[]
    # const activeProductIds = ...map...
    # We can just change _id: { $nin: activeProductIds } to _id: { $nin: activeProductIds as any[] }
    content = content.replace('_id: { $nin: activeProductIds }', '_id: { $nin: activeProductIds as any[] }')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_mongoose_types()
print("Fixed mongoose types!")
