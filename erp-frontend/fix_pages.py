import os
import glob
import re

def fix_pages():
    pattern = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/reports/**/*.tsx'
    files = glob.glob(pattern, recursive=True)
    
    for filepath in files:
        if 'page.tsx' in filepath and 'accounts\\' in filepath or 'inventory\\' in filepath or 'accounts/' in filepath or 'inventory/' in filepath:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # fix imports
            content = content.replace('../../../../components/reports/ReportLayout', '../../../../../components/reports/ReportLayout')
            content = content.replace('../../../../lib/erp-api', '../../../../../lib/erp-api')
            
            # fix type any
            content = re.sub(r'\(v\)\s*=>', '(v: any) =>', content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

fix_pages()
print("Fixed pages!")
