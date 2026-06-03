import os
import glob

def strip_injected_lines():
    target_lines = [
        "const [purchaseType, setPurchaseType] = useState<string>('GST');",
        "const [amountPaid, setAmountPaid] = useState<number>(0);",
        "const [additionalDiscount, setAdditionalDiscount] = useState<number>(0);",
        "const [globalDiscountAmount, setGlobalDiscountAmount] = useState<number>(0);",
        "const [discountPercent, setDiscountPercent] = useState<number>(0);"
    ]
    
    # search all files in purchases directory
    pattern = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/**/*.tsx'
    files = glob.glob(pattern, recursive=True)
    
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        new_lines = []
        for line in lines:
            if line.strip() in target_lines:
                # SKIP IT!
                pass
            else:
                new_lines.append(line)
                
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)

strip_injected_lines()
print("All exact injected duplicates stripped!")
