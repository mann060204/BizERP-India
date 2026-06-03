import os
import re

frontend_dir = r"d:\ERP WEBSITE\erp-frontend"

files_to_fix = [
    r"app\dashboard\sales\new\page.tsx",
    r"app\dashboard\sales\[id]\edit\page.tsx",
    r"app\dashboard\sales\returns\new\page.tsx",
    r"app\dashboard\sales\returns\[id]\edit\page.tsx",
    r"app\dashboard\purchases\new\page.tsx",
    r"app\dashboard\purchases\[id]\edit\page.tsx",
    r"app\dashboard\purchases\returns\new\page.tsx",
    r"app\dashboard\purchases\returns\[id]\edit\page.tsx",
    r"app\dashboard\quotations\new\page.tsx",
    r"app\dashboard\quotations\[id]\edit\page.tsx",
    r"app\dashboard\purchases\orders\new\page.tsx",
    r"app\dashboard\purchases\orders\[id]\edit\page.tsx"
]

for file_rel in files_to_fix:
    path = os.path.join(frontend_dir, file_rel)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace h-10 resize-none or h-12 resize-none with min-h-[80px] resize-y
        content = re.sub(r'h-10\s+resize-none', 'min-h-[80px] resize-y', content)
        content = re.sub(r'h-12\s+resize-none', 'min-h-[80px] resize-y', content)
        
        # Also let's check for any textarea that has a fixed small height and is related to remarks
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated remarks height in {file_rel}")
