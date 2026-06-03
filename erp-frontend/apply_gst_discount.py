import os
import re

frontend_dir = r"d:\ERP WEBSITE\erp-frontend\app\dashboard"

files_to_process = [
    "purchases/new/page.tsx",
    "purchases/[id]/edit/page.tsx",
    "purchases/returns/new/page.tsx",
    "purchases/returns/[id]/edit/page.tsx",
    "sales/new/page.tsx",
    "sales/[id]/edit/page.tsx",
    "sales/returns/new/page.tsx",
    "sales/returns/[id]/edit/page.tsx",
    "quotations/new/page.tsx",
    "quotations/[id]/edit/page.tsx",
    "purchases/orders/new/page.tsx",
    "purchases/orders/[id]/edit/page.tsx",
]

# 1. LineItem interface update
line_item_interface_pattern = re.compile(
    r"interface LineItem \{\s*productId\?: string; productName: string; hsnCode: string; batchNo: string; tag: string; description: string;\s*quantity: number; unit: string; rate: number; mrp: number; discount: number; gstRate: number; cess: number;\s*taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number;\s*\}",
    re.MULTILINE | re.DOTALL
)
new_line_item_interface = """interface LineItem { 
  productId?: string; productName: string; hsnCode: string; batchNo: string; tag: string; description: string;
  quantity: number; unit: string; rate: number; mrp: number; discount: number; discountAmount?: number; discountType?: 'percentage' | 'amount'; gstRate: number; cess: number;
  taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number; 
}"""

# 2. Update setItemInput initial state inside the component
# We can search for the default state assignment
item_input_pattern = re.compile(
    r"const \[itemInput, setItemInput\] = useState<LineItem>\(\{\s*productName: '', hsnCode: '', batchNo: '', tag: '', description: '',\s*quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 0, cess: 0,\s*taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0\s*\}\);",
    re.MULTILINE | re.DOTALL
)
new_item_input = """const [itemInput, setItemInput] = useState<LineItem>({
    productName: '', hsnCode: '', batchNo: '', tag: '', description: '',
    quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, discountAmount: 0, discountType: 'percentage', gstRate: 0, cess: 0,
    taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
  });"""

# 3. Update addItem
add_item_pattern = re.compile(
    r"setItemInput\(\{\s*productName: '', hsnCode: '', batchNo: '', tag: '', description: '',\s*quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 0, cess: 0,\s*taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0\s*\}\);",
    re.MULTILINE | re.DOTALL
)
new_add_item = """setItemInput({
      productName: '', hsnCode: '', batchNo: '', tag: '', description: '',
      quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, discountAmount: 0, discountType: 'percentage', gstRate: 0, cess: 0,
      taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
    });"""

# 4. Update calculateItem
calc_item_pattern = re.compile(
    r"const calculateItem = \(item: LineItem\) => \{\s*const gross = item\.quantity \* item\.rate;\s*const discountAmt = \(gross \* item\.discount\) / 100;\s*const taxableAmount = round2\(gross - discountAmt\);\s*const cgst = isInterState \? 0 : round2\(\(taxableAmount \* item\.gstRate\) / 2 / 100\);\s*const sgst = isInterState \? 0 : round2\(\(taxableAmount \* item\.gstRate\) / 2 / 100\);\s*const igst = isInterState \? round2\(\(taxableAmount \* item\.gstRate\) / 100\) : 0;\s*const cessAmt = round2\(\(taxableAmount \* item\.cess\) / 100\);\s*return \{ \.\.\.item, taxableAmount, cgst, sgst, igst, totalAmount: round2\(taxableAmount \+ cgst \+ sgst \+ igst \+ cessAmt\) \};\s*\};",
    re.MULTILINE | re.DOTALL
)
new_calc_item = """const calculateItem = (item: LineItem) => {
    const gross = item.quantity * item.rate;
    let discountAmt = item.discountAmount || 0;
    let discountPerc = item.discount || 0;
    
    if (item.discountType === 'amount') {
      discountPerc = gross > 0 ? (discountAmt / gross) * 100 : 0;
    } else {
      discountAmt = (gross * discountPerc) / 100;
    }
    
    const taxableAmount = round2(gross - discountAmt);
    const cgst = isInterState ? 0 : round2((taxableAmount * item.gstRate) / 2 / 100);
    const sgst = isInterState ? 0 : round2((taxableAmount * item.gstRate) / 2 / 100);
    const igst = isInterState ? round2((taxableAmount * item.gstRate) / 100) : 0;
    const cessAmt = round2((taxableAmount * item.cess) / 100);
    return { ...item, discount: round2(discountPerc), discountAmount: round2(discountAmt), taxableAmount, cgst, sgst, igst, totalAmount: round2(taxableAmount + cgst + sgst + igst + cessAmt) };
  };"""

import sys

for rel_path in files_to_process:
    file_path = os.path.join(frontend_dir, rel_path)
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = line_item_interface_pattern.sub(new_line_item_interface, content)
    content = item_input_pattern.sub(new_item_input, content)
    content = add_item_pattern.sub(new_add_item, content)
    content = calc_item_pattern.sub(new_calc_item, content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Applied phase 1 changes to all files.")
