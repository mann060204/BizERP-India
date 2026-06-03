import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import ManufacturingOrder from '../models/ManufacturingOrder.model';
import Product from '../models/Product.model';
import BOM from '../models/BOM.model';
import Batch from '../models/Batch.model';

// Utility to generate MO Number
const generateMONumber = async (businessId: any, prefix = 'MO') => {
  const count = await ManufacturingOrder.countDocuments({ businessId });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// 1. Create WIP MO (Pending)
export const createMO = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    body.businessId = req.user!.businessId;
    body.createdBy = req.user!.userId;
    body.type = 'WIP';
    body.status = 'Pending';
    body.orderNumber = await generateMONumber(body.businessId);

    const mo = new ManufacturingOrder(body);
    await mo.save();

    res.status(201).json({ message: 'Manufacturing Order Created (WIP)', mo });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// 2. Create Direct Manufacturing (Instant Complete)
export const createDirectManufacturing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    body.businessId = req.user!.businessId;
    body.createdBy = req.user!.userId;
    body.type = 'Direct';
    body.status = 'Completed';
    body.orderNumber = await generateMONumber(body.businessId, 'MFG');
    body.startDate = new Date();
    body.endDate = new Date();

    // 1. Deduct Raw Materials instantly
    for (const rm of body.rawMaterials || []) {
      await Product.findByIdAndUpdate(rm.productId, { $inc: { currentStock: -rm.quantityRequired } });
      // Note: Ideally, deduct from specific Batches if hasBatches is true. Simplified for now.
    }

    // 2. Add Scrap Items to stock
    for (const scrap of body.scrapItems || []) {
      await Product.findByIdAndUpdate(scrap.productId, { $inc: { currentStock: scrap.quantity } });
    }

    // 3. Calculate Effective Cost
    const rmCost = (body.rawMaterials || []).reduce((acc: number, curr: any) => acc + (curr.totalCost || 0), 0);
    const scrapVal = (body.scrapItems || []).reduce((acc: number, curr: any) => acc + (curr.totalRecoveryValue || 0), 0);
    const additionalCost = (body.actualLaborCost || 0) + (body.actualOverhead || 0);
    body.totalActualCost = rmCost - scrapVal + additionalCost;

    const mo = new ManufacturingOrder(body);
    await mo.save();

    // 4. Add Finished Goods and generate Batch
    const prod = await Product.findByIdAndUpdate(mo.productId, { $inc: { currentStock: mo.quantityToProduce } });
    if (prod) {
      const newBatch = new Batch({
        businessId: mo.businessId,
        productId: mo.productId,
        batchNo: `${body.orderNumber}`,
        mrp: prod.mrp || prod.sellingPrice,
        salePrice: prod.sellingPrice,
        minSalePrice: prod.minSalePrice || prod.sellingPrice,
        qualityStatus: 'Passed',
        currentStock: mo.quantityToProduce,
        isActive: true
      });
      await newBatch.save();
      mo.batchNoGenerated = newBatch.batchNo;
      await mo.save();
    }

    res.status(201).json({ message: 'Direct Manufacturing Journal Saved', mo });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// 3. Create Reverse Manufacturing (Disassembly)
export const createReverseManufacturing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    body.businessId = req.user!.businessId;
    body.createdBy = req.user!.userId;
    body.type = 'Disassembly';
    body.status = 'Completed';
    body.orderNumber = await generateMONumber(body.businessId, 'REV');
    body.startDate = new Date();
    body.endDate = new Date();

    // 1. Deduct Finished Goods from stock
    const prod = await Product.findByIdAndUpdate(body.productId, { $inc: { currentStock: -body.quantityToProduce } });
    
    // Deduct from specific batch if provided
    if (body.batchNoGenerated) {
       await Batch.findOneAndUpdate(
         { businessId: body.businessId, productId: body.productId, batchNo: body.batchNoGenerated },
         { $inc: { currentStock: -body.quantityToProduce } }
       );
    }

    // 2. Add Raw Materials back to stock
    for (const rm of body.rawMaterials || []) {
      await Product.findByIdAndUpdate(rm.productId, { $inc: { currentStock: rm.quantityRequired } });
    }

    body.totalActualCost = 0; // Cost is returning to components
    const mo = new ManufacturingOrder(body);
    await mo.save();

    res.status(201).json({ message: 'Disassembly Journal Saved', mo });
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
        await Product.findByIdAndUpdate(rm.productId, { $inc: { currentStock: -rm.quantityRequired } });
        rm.quantityConsumed = rm.quantityRequired;
      }
      mo.startDate = new Date();
    }

    // If moving to Completed, add finished goods
    if (mo.status === 'In-Progress' && status === 'Completed') {
      const prod = await Product.findByIdAndUpdate(mo.productId, { $inc: { currentStock: mo.quantityToProduce } });
      
      // Add Scrap
      for (const scrap of mo.scrapItems || []) {
        await Product.findByIdAndUpdate(scrap.productId, { $inc: { currentStock: scrap.quantity } });
      }

      mo.endDate = new Date();
      const rmCost = mo.rawMaterials.reduce((acc, curr) => acc + curr.totalCost, 0);
      const scrapVal = (mo.scrapItems || []).reduce((acc, curr) => acc + curr.totalRecoveryValue, 0);
      mo.totalActualCost = rmCost - scrapVal + mo.actualLaborCost + mo.actualOverhead;
      
      // Auto-generate batch
      if (prod) {
        const newBatch = new Batch({
          businessId: mo.businessId,
          productId: mo.productId,
          batchNo: `WIP-${mo.orderNumber}`,
          mrp: prod.mrp || prod.sellingPrice,
          salePrice: prod.sellingPrice,
          minSalePrice: prod.minSalePrice || prod.sellingPrice,
          qualityStatus: 'Passed',
          currentStock: mo.quantityToProduce,
          isActive: true
        });
        await newBatch.save();
        mo.batchNoGenerated = newBatch.batchNo;
      }
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

export const getProductionPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bomId, targetQuantity } = req.body;
    const qty = Number(targetQuantity) || 1;

    const bom = await BOM.findOne({ _id: bomId, businessId: req.user!.businessId });
    if (!bom) { res.status(404).json({ message: 'BOM not found' }); return; }

    const shortages = [];
    let hasShortage = false;

    for (const comp of bom.components) {
      const prod = await Product.findOne({ _id: comp.productId, businessId: req.user!.businessId });
      const required = comp.quantity * qty;
      const available = prod ? (prod.currentStock || 0) : 0;
      
      if (available < required) {
        hasShortage = true;
        shortages.push({
          productId: comp.productId,
          productName: comp.productName,
          required,
          available,
          shortage: required - available
        });
      }
    }

    res.json({
      bomId,
      targetQuantity: qty,
      hasShortage,
      shortages
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
