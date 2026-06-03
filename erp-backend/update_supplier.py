import re

def update_supplier_controller():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/supplier.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Import AccountLedger & AccountingService
    if "import AccountLedger" not in content:
        content = content.replace("import Supplier from '../models/Supplier.model';", "import Supplier from '../models/Supplier.model';\nimport AccountLedger from '../models/AccountLedger.model';\nimport { AccountingService } from '../services/accounting.service';")

    # Add endpoints
    if "export const getSupplierLedger" not in content:
        new_methods = """
// GET /api/v1/suppliers/:id/ledger
export const getSupplierLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const supplierId = req.params['id'];
    
    const currentBalance = await AccountingService.updateSupplierBalance(supplierId, businessId);
    
    const ledger = await AccountLedger.find({ businessId, supplierId }).sort({ date: -1, createdAt: -1 });
    res.json({ ledger, currentBalance });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/suppliers/:id/payments
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const supplierId = req.params['id'];
    const { amount, paymentMode, date, referenceNo, notes } = req.body;
    
    if (!amount || amount <= 0) { res.status(400).json({ message: 'Valid amount is required' }); return; }
    
    const newBalance = await AccountingService.recordSupplierPayment(
      businessId, 
      supplierId, 
      Number(amount), 
      paymentMode || 'Cash', 
      date ? new Date(date) : new Date(), 
      referenceNo || '', 
      notes || ''
    );
    
    res.json({ message: 'Payment recorded successfully', newBalance });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
"""
        content += new_methods

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def update_supplier_routes():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/routes/supplier.routes.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("createBulkSuppliers } from '../controllers/supplier.controller';", "createBulkSuppliers, getSupplierLedger, recordPayment } from '../controllers/supplier.controller';")

    routes_to_add = "router.get('/:id/ledger', getSupplierLedger);\nrouter.post('/:id/payments', recordPayment);\n"
    content = content.replace("router.get('/:id', getSupplier);", "router.get('/:id', getSupplier);\n" + routes_to_add)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_supplier_controller()
update_supplier_routes()
print("Updated supplier controller and routes!")
