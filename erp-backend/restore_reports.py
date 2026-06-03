import subprocess
import os

def restore_methods():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/reports.controller.ts'
    
    # 1. Get old controller contents
    result = subprocess.run(['git', 'show', '8c559ff:erp-backend/src/controllers/reports.controller.ts'], 
                            cwd='d:/ERP WEBSITE/erp-backend', capture_output=True, text=True)
    old_content = result.stdout
    
    # 2. Extract imports (PurchaseBill, Expense)
    imports_to_add = "import PurchaseBill from '../models/PurchaseBill.model';\nimport Expense from '../models/Expense.model';\n"
    
    # 3. Extract methods
    # We want everything from "// Helper to get date range" to the end of the file.
    start_idx = old_content.find("// Helper to get date range")
    methods_content = old_content[start_idx:]
    
    # 4. Read current file
    with open(filepath, 'r', encoding='utf-8') as f:
        current_content = f.read()
        
    # 5. Insert imports at the top (after the first few lines of imports)
    import_idx = current_content.find("\n\n// Helper for sending success response")
    new_content = current_content[:import_idx] + "\n" + imports_to_add + current_content[import_idx:]
    
    # 6. Append methods at the bottom
    new_content += "\n\n// --- OLD REPORTS RESTORED ---\n\n" + methods_content
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

restore_methods()
print("Restored methods in reports.controller.ts!")
