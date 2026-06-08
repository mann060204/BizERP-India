import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Customer from '../models/Customer.model';
import AccountLedger from '../models/AccountLedger.model';
import { AccountingService } from '../services/accounting.service';

// GET /api/v1/customers
export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId, isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { tradeName: { $regex: search, $options: 'i' } },
        { 'billingAddress.city': { $regex: search, $options: 'i' } },
        { 'billingAddress.state': { $regex: search, $options: 'i' } },
        { 'billingAddress.street': { $regex: search, $options: 'i' } },
        { 'billingAddress.pinCode': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Customer.countDocuments(query),
    ]);
    res.json({ customers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/customers/:id
export const getCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
    res.json({ customer });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/customers
export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, mobile } = req.body;
    
    const orConditions: any[] = [];
    if (name) orConditions.push({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (mobile && mobile.trim() !== '') orConditions.push({ mobile: mobile.trim() });
    
    if (orConditions.length > 0) {
      const existing = await Customer.findOne({
        businessId: req.user!.businessId,
        isActive: true,
        $or: orConditions
      });
      
      if (existing) {
        res.status(400).json({ message: 'A customer with this Name or Mobile No. already exists.' });
        return;
      }
    }

    const customer = await Customer.create({ ...req.body, businessId: req.user!.businessId });
    await AccountingService.updateCustomerBalance(customer._id, customer.businessId.toString());
    res.status(201).json({ message: 'Customer created', customer });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/customers/:id
export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, mobile } = req.body;
    
    const orConditions: any[] = [];
    if (name) orConditions.push({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (mobile && mobile.trim() !== '') orConditions.push({ mobile: mobile.trim() });
    
    if (orConditions.length > 0) {
      const existing = await Customer.findOne({
        _id: { $ne: req.params['id'] },
        businessId: req.user!.businessId,
        isActive: true,
        $or: orConditions
      });
      
      if (existing) {
        res.status(400).json({ message: 'Another customer with this Name or Mobile No. already exists.' });
        return;
      }
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
    await AccountingService.updateCustomerBalance(customer._id, customer.businessId.toString());
    res.json({ message: 'Customer updated', customer });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/customers/:id
export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Customer.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      { isActive: false }
    );
    res.json({ message: 'Customer deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/customers/bulk
export const createBulkCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customers = req.body.customers || [];
    if (!Array.isArray(customers) || customers.length === 0) {
      res.status(400).json({ message: 'Valid array of customers is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const bulkData = customers.map((c: any) => ({
      ...c,
      businessId,
    }));

    const inserted = await Customer.insertMany(bulkData);
    res.status(201).json({ message: `${inserted.length} customers imported successfully`, insertedCount: inserted.length });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/customers/:id/ledger
export const getCustomerLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params['id'] as string;
    
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
    const customerId = req.params['id'] as string;
    const { amount, paymentMode, date, referenceNo, notes, bankId } = req.body;
    
    if (!amount || amount <= 0) { res.status(400).json({ message: 'Valid amount is required' }); return; }
    
    const newBalance = await AccountingService.recordCustomerPayment(
      businessId, 
      customerId, 
      Number(amount), 
      paymentMode || 'Cash', 
      date ? new Date(date) : new Date(), 
      referenceNo || '', 
      notes || '',
      bankId === '' ? undefined : bankId
    );
    
    res.json({ message: 'Payment recorded successfully', newBalance });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
// POST /api/v1/customers/:id/adjustments
export const addLedgerAdjustment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const customerId = req.params['id'] as string;
    const { amount, type, date, description } = req.body;

    if (!amount || amount <= 0 || !['Debit', 'Credit'].includes(type)) {
      res.status(400).json({ message: 'Valid amount and type (Debit/Credit) are required' });
      return;
    }

    const newBalance = await AccountingService.addManualAdjustment(
      businessId,
      customerId,
      'Customer',
      type,
      Number(amount),
      date ? new Date(date) : new Date(),
      description || 'Manual Adjustment'
    );

    res.json({ message: 'Adjustment added successfully', newBalance });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/customers/:id/ledger/:ledgerId
export const updateCustomerLedgerEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { ledgerId } = req.params;
    const { amount, date, description } = req.body;

    const newBalance = await AccountingService.updateLedgerEntry(businessId, ledgerId as string, {
      amount: amount ? Number(amount) : undefined,
      date: date ? new Date(date) : undefined,
      description
    });

    res.json({ message: 'Ledger entry updated successfully', newBalance });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/customers/:id/ledger/:ledgerId
export const deleteCustomerLedgerEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { ledgerId } = req.params;

    const newBalance = await AccountingService.deleteLedgerEntry(businessId, ledgerId as string);

    res.json({ message: 'Ledger entry deleted successfully', newBalance });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
