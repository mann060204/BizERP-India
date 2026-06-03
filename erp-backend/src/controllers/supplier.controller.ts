import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Supplier from '../models/Supplier.model';
import AccountLedger from '../models/AccountLedger.model';
import { AccountingService } from '../services/accounting.service';

// GET /api/v1/suppliers
export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId, isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Supplier.countDocuments(query),
    ]);
    res.json({ suppliers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/suppliers/:id
export const getSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!supplier) { res.status(404).json({ message: 'Supplier not found' }); return; }
    res.json({ supplier });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/suppliers
export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.create({ ...req.body, businessId: req.user!.businessId });
    res.status(201).json({ message: 'Supplier created', supplier });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/suppliers/:id
export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) { res.status(404).json({ message: 'Supplier not found' }); return; }
    res.json({ message: 'Supplier updated', supplier });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/suppliers/:id
export const deleteSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Supplier.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      { isActive: false }
    );
    res.json({ message: 'Supplier deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

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
