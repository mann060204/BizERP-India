import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import ManufacturingOrder from '../models/ManufacturingOrder.model';
import Product from '../models/Product.model';
import BOM from '../models/BOM.model';
import Batch from '../models/Batch.model';

const generateMONumber = async (businessId: any, prefix = 'MFG') => {
  const count = await ManufacturingOrder.countDocuments({ businessId });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// ─── PREVIEW ──────────────────────────────────────────────────────────────────
// POST /manufacturing/preview
// Returns RM requirements + stock availability. NO DB write.
export const previewProduction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { productId, produceQty } = req.body;
    if (!productId || !produceQty || Number(produceQty) <= 0) {
      res.status(400).json({ message: 'productId and produceQty > 0 are required' });
      return;
    }
    const qty = Number(produceQty);
    const bom = await BOM.findOne({ businessId, productId, isActive: true });
    if (!bom || bom.components.length === 0) {
      res.status(400).json({ message: 'No active BOM found for this product. Create a BOM first.' });
      return;
    }

    let allAvailable = true;
    const lines = await Promise.all(bom.components.map(async (comp) => {
      const prod = await Product.findOne({ _id: comp.productId, businessId });
      const required = comp.quantity * qty;
      const available = prod?.currentStock ?? 0;
      const shortage = Math.max(0, required - available);
      if (shortage > 0) allAvailable = false;
      return {
        productId: comp.productId,
        productName: comp.productName,
        unit: prod?.unit || comp.unit,
        qtyPerUnit: comp.quantity,
        required,
        available,
        shortage,
        rate: comp.costPerUnit,
        amount: required * comp.costPerUnit,
        ok: shortage === 0,
      };
    }));

    const totalCost = lines.reduce((acc, l) => acc + l.amount, 0);
    const costPerUnit = qty > 0 ? totalCost / qty : 0;

    res.json({
      bom: { _id: bom._id, bomNumber: bom.bomNumber, directLaborCost: bom.directLaborCost, manufacturingOverhead: bom.manufacturingOverhead },
      lines,
      totalCost,
      costPerUnit,
      allAvailable,
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// ─── CREATE DRAFT ─────────────────────────────────────────────────────────────
// POST /manufacturing
export const createDraftProduction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { productId, produceQty, notes, startDate } = req.body;
    if (!productId || !produceQty || Number(produceQty) <= 0) {
      res.status(400).json({ message: 'productId and produceQty > 0 are required' });
      return;
    }
    const qty = Number(produceQty);
    const bom = await BOM.findOne({ businessId, productId, isActive: true });
    if (!bom || bom.components.length === 0) {
      res.status(400).json({ message: 'No active BOM found. Create a BOM first.' });
      return;
    }
    const fgProd = await Product.findOne({ _id: productId, businessId });
    if (!fgProd) { res.status(404).json({ message: 'Finished Good not found' }); return; }

    const rawMaterials = bom.components.map((comp) => ({
      productId: comp.productId,
      productName: comp.productName,
      quantityRequired: comp.quantity * qty,
      quantityConsumed: 0,
      unit: comp.unit,
      costPerUnit: comp.costPerUnit,
      totalCost: (comp.quantity * qty) * comp.costPerUnit,
    }));

    const totalEstimatedCost = rawMaterials.reduce((acc, r) => acc + r.totalCost, 0)
      + (bom.directLaborCost + bom.manufacturingOverhead) * qty;

    const mo = new ManufacturingOrder({
      businessId, createdBy: req.user!.userId,
      orderNumber: await generateMONumber(businessId),
      bomId: bom._id, productId, productName: fgProd.name,
      quantityToProduce: qty,
      type: 'Direct', status: 'Pending',
      rawMaterials, notes,
      startDate: startDate || new Date(),
      estimatedLaborCost: bom.directLaborCost * qty,
      estimatedOverhead: bom.manufacturingOverhead * qty,
      totalEstimatedCost,
      actualLaborCost: bom.directLaborCost * qty,
      actualOverhead: bom.manufacturingOverhead * qty,
    });
    await mo.save();
    res.status(201).json({ message: 'Production order created (Pending)', mo });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// ─── CONFIRM (Transactional) ───────────────────────────────────────────────────
// POST /manufacturing/:id/confirm
export const confirmProduction = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const businessId = req.user!.businessId;
    const mo = await ManufacturingOrder.findOne({ _id: req.params.id, businessId }).session(session);
    if (!mo) { await session.abortTransaction(); res.status(404).json({ message: 'Order not found' }); return; }
    if (mo.status !== 'Pending') {
      await session.abortTransaction();
      res.status(400).json({ message: `Order is already ${mo.status}, cannot confirm` });
      return;
    }

    // Fetch fresh BOM
    const bom = await BOM.findOne({ businessId, productId: mo.productId, isActive: true }).session(session);
    if (!bom || bom.components.length === 0) {
      await session.abortTransaction();
      res.status(400).json({ message: 'BOM not found or has no components' });
      return;
    }

    const qty = mo.quantityToProduce;

    // Step 1: VALIDATE all RM stock before any changes
    const shortages: { productName: string; required: number; available: number; short: number }[] = [];
    for (const comp of bom.components) {
      const prod = await Product.findOne({ _id: comp.productId, businessId }).session(session);
      const required = comp.quantity * qty;
      const available = prod?.currentStock ?? 0;
      if (available < required) {
        shortages.push({ productName: comp.productName, required, available, short: required - available });
      }
    }
    if (shortages.length > 0) {
      await session.abortTransaction();
      res.status(422).json({ message: 'Insufficient stock for some raw materials', shortages });
      return;
    }

    // Step 2: Apply stock changes
    const consumedLines = [];
    let totalActualCost = 0;

    for (const comp of bom.components) {
      const required = comp.quantity * qty;
      const amount = required * comp.costPerUnit;
      totalActualCost += amount;
      consumedLines.push({
        productId: comp.productId,
        productName: comp.productName,
        quantityRequired: required,
        quantityConsumed: required,
        unit: comp.unit,
        costPerUnit: comp.costPerUnit,
        totalCost: amount,
      });
      // Deduct RM
      await Product.findByIdAndUpdate(comp.productId, { $inc: { currentStock: -required } }, { session });
    }

    // Add overhead/labor cost
    totalActualCost += (bom.directLaborCost + bom.manufacturingOverhead) * qty;

    // Add FG stock
    await Product.findByIdAndUpdate(mo.productId, { $inc: { currentStock: qty } }, { session });

    // Update MO
    mo.rawMaterials = consumedLines as any;
    mo.status = 'Completed';
    mo.endDate = new Date();
    mo.totalActualCost = totalActualCost;
    mo.actualLaborCost = bom.directLaborCost * qty;
    mo.actualOverhead = bom.manufacturingOverhead * qty;
    await mo.save({ session });

    await session.commitTransaction();
    res.json({ message: 'Production confirmed. Stock updated.', mo });
  } catch (e: any) {
    await session.abortTransaction();
    res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
};

// ─── CANCEL ────────────────────────────────────────────────────────────────────
// POST /manufacturing/:id/cancel
export const cancelProduction = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const businessId = req.user!.businessId;
    const mo = await ManufacturingOrder.findOne({ _id: req.params.id, businessId }).session(session);
    if (!mo) { await session.abortTransaction(); res.status(404).json({ message: 'Order not found' }); return; }

    if (mo.status === 'Cancelled') {
      await session.abortTransaction(); res.status(400).json({ message: 'Already cancelled' }); return;
    }

    // Reverse stock only if it was Completed (stock was moved)
    if (mo.status === 'Completed') {
      // Restore RM stock
      for (const rm of mo.rawMaterials) {
        await Product.findByIdAndUpdate(rm.productId, { $inc: { currentStock: rm.quantityConsumed } }, { session });
      }
      // Deduct FG stock
      await Product.findByIdAndUpdate(mo.productId, { $inc: { currentStock: -mo.quantityToProduce } }, { session });
    }

    mo.status = 'Cancelled';
    await mo.save({ session });

    await session.commitTransaction();
    res.json({ message: 'Production cancelled. Stock reversed.', mo });
  } catch (e: any) {
    await session.abortTransaction();
    res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
};

// ─── GET ALL ───────────────────────────────────────────────────────────────────
export const getMOs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mos = await ManufacturingOrder.find({ businessId: req.user!.businessId }).sort({ createdAt: -1 });
    res.json({ mos });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getMOById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mo = await ManufacturingOrder.findOne({ _id: req.params.id, businessId: req.user!.businessId });
    if (!mo) { res.status(404).json({ message: 'Order not found' }); return; }
    res.json({ mo });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteMO = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mo = await ManufacturingOrder.findOne({ _id: req.params.id, businessId: req.user!.businessId });
    if (!mo) { res.status(404).json({ message: 'Order not found' }); return; }
    if (mo.status === 'Completed') { res.status(400).json({ message: 'Cannot delete a completed order. Cancel it first.' }); return; }
    await ManufacturingOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// Keep old handlers for backward compat
export const createMO = createDraftProduction;
export const createDirectManufacturing = createDraftProduction;
export const createReverseManufacturing = createDraftProduction;
export const updateMOStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;
  if (status === 'Completed') return confirmProduction(req, res);
  if (status === 'Cancelled') return cancelProduction(req, res);
  res.status(400).json({ message: 'Use /confirm or /cancel endpoints' });
};
export const getProductionPlan = previewProduction;
