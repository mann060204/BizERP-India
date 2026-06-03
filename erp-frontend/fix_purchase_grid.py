import os
import re

frontend_dir = r"d:\ERP WEBSITE\erp-frontend"

files_to_fix = [
    r"app\dashboard\purchases\new\page.tsx",
    r"app\dashboard\purchases\[id]\edit\page.tsx",
    r"app\dashboard\purchases\returns\new\page.tsx",
    r"app\dashboard\purchases\returns\[id]\edit\page.tsx",
    r"app\dashboard\purchases\orders\new\page.tsx",
    r"app\dashboard\purchases\orders\[id]\edit\page.tsx"
]

for file_rel in files_to_fix:
    path = os.path.join(frontend_dir, file_rel)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace grid classes
        grid_gst = "grid-cols-[1fr_3fr_1fr_1fr_1.5fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr]"
        grid_nongst = "grid-cols-[1fr_3fr_1fr_1fr_1.5fr_1fr_2fr]"
        
        # Replace the dynamic class: `grid ${ purchaseType !== 'Non-GST' ? 'grid-cols-13' : 'grid-cols-10' }
        content = re.sub(
            r"`grid \$\{\s*purchaseType !== 'Non-GST' \? 'grid-cols-13' : 'grid-cols-10'\s*\}`",
            f"`grid ${{ purchaseType !== 'Non-GST' ? '{grid_gst}' : '{grid_nongst}' }}`",
            content
        )

        # Remove col-span-2 from Amount header
        content = re.sub(r'className="col-span-2([^"]*)">Amount</div>', r'className="\1">Amount</div>', content)
        
        # Remove col-span-2 from Amount row data
        content = re.sub(
            r'<div className="col-span-2([^"]*)">\s*<span>\s*₹\{item\.totalAmount\.toFixed\(2\)\}\s*</span>',
            r'<div className="\1">\n                      <span>₹{item.totalAmount.toFixed(2)}</span>',
            content
        )
        content = re.sub(
            r'<div className="col-span-2([^"]*)">\s*<span>\s*₹\{item\.totalAmount \> 0 \? item\.totalAmount\.toFixed\(2\) : \x27\x27\}\s*</span>',
            r'<div className="\1">\n                      <span>₹{item.totalAmount > 0 ? item.totalAmount.toFixed(2) : \'\'}</span>',
            content
        )
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed grid in {file_rel}")
