import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import BOM from '../models/BOM.model';
import Product from '../models/Product.model';

export const createBOM = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    body.businessId = req.user!.businessId;
    body.createdBy = req.user!.userId;

    const count = await BOM.countDocuments({ businessId: req.user!.businessId });
    body.bomNumber = `BOM-${String(count + 1).padStart(3, '0')}`;

    const bom = new BOM(body);
    await bom.save();

    res.status(201).json({ message: 'BOM Created', bom });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getBOMs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boms = await BOM.find({ businessId: req.user!.businessId }).sort({ createdAt: -1 });
    res.json({ boms });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getBOMById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bom = await BOM.findOne({ _id: req.params.id, businessId: req.user!.businessId });
    if (!bom) { res.status(404).json({ message: 'BOM not found' }); return; }
    res.json({ bom });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const updateBOM = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bom = await BOM.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user!.businessId },
      { $set: req.body },
      { new: true }
    );
    if (!bom) { res.status(404).json({ message: 'BOM not found' }); return; }
    res.json({ message: 'BOM updated', bom });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const deleteBOM = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bom = await BOM.findOneAndDelete({ _id: req.params.id, businessId: req.user!.businessId });
    if (!bom) { res.status(404).json({ message: 'BOM not found' }); return; }
    res.json({ message: 'BOM deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
