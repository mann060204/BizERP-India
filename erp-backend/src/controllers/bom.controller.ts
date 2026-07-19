import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import BOM from '../models/BOM.model';
import Product from '../models/Product.model';
import { convertToMainUnit } from '../utils/conversionUtils';

// Detect circular BOM references using DFS
const detectCycle = async (
  businessId: string, rootFgId: string, currentRmId: string, visited = new Set<string>()
): Promise<boolean> => {
  if (currentRmId === rootFgId) return true;
  if (visited.has(currentRmId)) return false;
  visited.add(currentRmId);
  const childBom = await BOM.findOne({ businessId, productId: currentRmId });
  if (!childBom) return false;
  for (const comp of childBom.components) {
    const childId = comp.productId.toString();
    if (childId === rootFgId) return true;
    if (await detectCycle(businessId, rootFgId, childId, visited)) return true;
  }
  return false;
};

// Recursively calculate BOM cost per 1 unit of FG (multi-level, dual-unit aware)
export const calcBOMCost = async (businessId: string, productId: string, depth = 0): Promise<number> => {
  if (depth > 10) return 0;
  const bom = await BOM.findOne({ businessId, productId, isActive: true });
  if (!bom || bom.components.length === 0) {
    const prod = await Product.findOne({ _id: productId, businessId });
    return prod?.purchasePrice || 0;
  }
  let totalCost = 0;
  for (const comp of bom.components) {
    const rmProd = await Product.findOne({ _id: comp.productId, businessId });
    const isSFG = rmProd?.productType === 'WIP Component';
    let costPerUnit = comp.costPerUnit;
    if (isSFG) costPerUnit = await calcBOMCost(businessId, comp.productId.toString(), depth + 1);

    // Convert qty to main unit before multiplying by rate
    let qtyInMainUnit = comp.quantity;
    if (comp.qtyUnitType === 'SECOND' && rmProd && rmProd.secondaryUnit) {
      try {
        qtyInMainUnit = convertToMainUnit(comp.quantity, rmProd.secondaryUnit, rmProd);
      } catch { /* skip if no rate configured */ }
    }
    totalCost += qtyInMainUnit * costPerUnit;
  }
  return totalCost + (bom.directLaborCost || 0) + (bom.manufacturingOverhead || 0);
};

// GET /bom
export const getBOMs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boms = await BOM.find({ businessId: req.user!.businessId }).sort({ createdAt: -1 });
    res.json({ boms });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /bom/product/:productId
export const getBOMByProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const bom = await BOM.findOne({ businessId, productId: req.params.productId, isActive: true });
    if (!bom) { res.json({ bom: null, totalCostPerUnit: 0 }); return; }
    const enrichedComponents = await Promise.all(bom.components.map(async (comp) => {
      const prod = await Product.findOne({ _id: comp.productId, businessId });
      return {
        ...comp.toObject(),
        currentStock: prod?.currentStock ?? 0,
        productType: prod?.productType ?? 'General',
        unit: prod?.unit || comp.unit,
        secondaryUnit: prod?.secondaryUnit || null,  // expose for BOM UI unit toggle
        conversionRate: prod?.conversionRate || null,
        qtyUnitType: comp.qtyUnitType || 'MAIN',
      };
    }));
    const totalCostPerUnit = await calcBOMCost(businessId.toString(), bom.productId.toString());
    res.json({ bom: { ...bom.toObject(), components: enrichedComponents }, totalCostPerUnit });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /bom/product/:productId — upsert full BOM
export const saveBOMForProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const fgProductId = req.params.productId;
    const { components = [], directLaborCost = 0, manufacturingOverhead = 0 } = req.body;

    const fgProd = await Product.findOne({ _id: fgProductId, businessId });
    if (!fgProd) { res.status(404).json({ message: 'Finished Good product not found' }); return; }
    if (fgProd.productType !== 'Finished Good' && fgProd.productType !== 'WIP Component') {
      res.status(400).json({ message: `Item must be type "Finished Good" or "WIP Component", currently "${fgProd.productType}"` });
      return;
    }
    for (const comp of components) {
      if (comp.productId === fgProductId) { res.status(400).json({ message: `A product cannot be its own BOM component` }); return; }
      if (!comp.quantity || comp.quantity <= 0) { res.status(400).json({ message: `Qty for all components must be > 0` }); return; }
      const hasCycle = await detectCycle(businessId.toString(), fgProductId, comp.productId);
      if (hasCycle) {
        const cp = await Product.findById(comp.productId);
        res.status(400).json({ message: `Circular BOM reference: "${cp?.name}" creates a cycle` });
        return;
      }
    }

    const enrichedComponents = components.map((comp: any) => ({
      ...comp,
      qtyUnitType: comp.qtyUnitType || 'MAIN',
      totalCost: (comp.quantity || 0) * (comp.costPerUnit || 0),
    }));
    const materialCost = enrichedComponents.reduce((acc: number, c: any) => acc + c.totalCost, 0);
    const totalEstimatedCost = materialCost + Number(directLaborCost) + Number(manufacturingOverhead);

    const existing = await BOM.findOne({ businessId, productId: fgProductId });
    const count = await BOM.countDocuments({ businessId });

    if (existing) {
      existing.components = enrichedComponents;
      existing.directLaborCost = Number(directLaborCost);
      existing.manufacturingOverhead = Number(manufacturingOverhead);
      existing.totalEstimatedCost = totalEstimatedCost;
      existing.isActive = true;
      await existing.save();
      res.json({ message: 'BOM updated', bom: existing });
    } else {
      const bom = new BOM({
        businessId, productId: fgProductId, productName: fgProd.name,
        bomNumber: `BOM-${String(count + 1).padStart(3, '0')}`,
        components: enrichedComponents, directLaborCost: Number(directLaborCost),
        manufacturingOverhead: Number(manufacturingOverhead), totalEstimatedCost,
        isActive: true, createdBy: req.user!.userId,
      });
      await bom.save();
      res.status(201).json({ message: 'BOM created', bom });
    }
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getBOMById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bom = await BOM.findOne({ _id: req.params.id, businessId: req.user!.businessId });
    if (!bom) { res.status(404).json({ message: 'BOM not found' }); return; }
    res.json({ bom });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const deleteBOM = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bom = await BOM.findOneAndDelete({ _id: req.params.id, businessId: req.user!.businessId });
    if (!bom) { res.status(404).json({ message: 'BOM not found' }); return; }
    res.json({ message: 'BOM deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

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

export const updateBOM = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bom = await BOM.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user!.businessId },
      { $set: req.body }, { new: true }
    );
    if (!bom) { res.status(404).json({ message: 'BOM not found' }); return; }
    res.json({ message: 'BOM updated', bom });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
