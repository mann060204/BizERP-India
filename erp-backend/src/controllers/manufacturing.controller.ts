import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import ManufacturingOrder from '../models/ManufacturingOrder.model';
import Product from '../models/Product.model';
import BOM from '../models/BOM.model';

export const createMO = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    body.businessId = req.user!.businessId;
    body.createdBy = req.user!.userId;

    // Generate MO Number
    const count = await ManufacturingOrder.countDocuments({ businessId: req.user!.businessId });
    body.orderNumber = `MO-${String(count + 1).padStart(4, '0')}`;
    
    body.status = 'Pending';
    const mo = new ManufacturingOrder(body);
    await mo.save();

    res.status(201).json({ message: 'Manufacturing Order Created', mo });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getMOs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mos = await ManufacturingOrder.find({ businessId: req.user!.businessId }).sort({ createdAt: -1 });
    res.json({ mos });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const updateMOStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const mo = await ManufacturingOrder.findOne({ _id: req.params.id, businessId: req.user!.businessId });
    if (!mo) { res.status(404).json({ message: 'Manufacturing Order not found' }); return; }

    // If moving to In-Progress, deduct raw materials
    if (mo.status === 'Pending' && status === 'In-Progress') {
      for (const rm of mo.rawMaterials) {
        await Product.findByIdAndUpdate(rm.productId, {
          $inc: { currentStock: -rm.quantityRequired }
        });
        rm.quantityConsumed = rm.quantityRequired; // simplify: full consumption
      }
      mo.startDate = new Date();
    }

    // If moving to Completed, add finished goods
    if (mo.status === 'In-Progress' && status === 'Completed') {
      await Product.findByIdAndUpdate(mo.productId, {
        $inc: { currentStock: mo.quantityToProduce }
      });
      mo.endDate = new Date();
      mo.totalActualCost = mo.rawMaterials.reduce((acc, curr) => acc + curr.totalCost, 0) + mo.actualLaborCost + mo.actualOverhead;
      
      // Update Finished Good's average cost/purchasePrice if necessary?
      // Optional enhancement.
    }

    mo.status = status;
    await mo.save();
    
    res.json({ message: `Order status updated to ${status}`, mo });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const deleteMO = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mo = await ManufacturingOrder.findOneAndDelete({ _id: req.params.id, businessId: req.user!.businessId });
    if (!mo) { res.status(404).json({ message: 'Manufacturing Order not found' }); return; }
    res.json({ message: 'Manufacturing Order deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
