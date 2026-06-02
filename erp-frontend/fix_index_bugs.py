import os

page_path = r"d:\ERP WEBSITE\erp-frontend\app\dashboard\purchases\returns\page.tsx"

with open(page_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("/dashboard/purchaseReturns/new", "/dashboard/purchases/returns/new")
content = content.replace("/dashboard/purchaseReturns/", "/dashboard/purchases/returns/")

with open(page_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed")
