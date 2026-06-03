import re

def update_customer_controller():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/customer.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Import AccountLedger & AccountingService
    if "import AccountLedger" not in content:
        content = content.replace("import Customer from '../models/Customer.model';", "import Customer from '../models/Customer.model';\nimport AccountLedger from '../models/AccountLedger.model';\nimport { AccountingService } from '../services/accounting.service';")

    # Add endpoints
    if "export const getCustomerLedger" not in content:
        new_methods = """
// GET /api/v1/customers/:id/ledger
export const getCustomerLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params['id'];
    
    // Auto-update balance first to ensure it's synced
    const currentBalance = await AccountingService.updateCustomerBalance(customerId, businessId);
    
    const ledger = await AccountLedger.find({ businessId, customerId }).sort({ date: -1, createdAt: -1 });
    res.json({ ledger, currentBalance });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/customers/:id/payments
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params['id'];
    const { amount, paymentMode, date, referenceNo, notes } = req.body;
    
    if (!amount || amount <= 0) { res.status(400).json({ message: 'Valid amount is required' }); return; }
    
    const newBalance = await AccountingService.recordCustomerPayment(
      businessId, 
      customerId, 
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

update_customer_controller()
print("Updated customer controller!")
