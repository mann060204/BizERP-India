import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Supplier from '../models/Supplier.model';

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
