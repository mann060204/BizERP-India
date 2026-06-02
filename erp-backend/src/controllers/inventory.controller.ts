import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Product from '../models/Product.model';
import InventoryAdjustment from '../models/InventoryAdjustment.model';
import Batch from '../models/Batch.model';
import BatchLog from '../models/BatchLog.model';
import Business from '../models/Business.model';

// GET /api/v1/inventory
export const getInventoryLevels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, lowStock, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId, type: 'product', isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (lowStock === 'true') query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [inventory, total] = await Promise.all([
      Product.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);

    // Calculate total stock value
    const allProducts = await Product.find({ businessId, type: 'product', isActive: true }, 'currentStock purchasePrice reorderLevel');
    const totalStockValue = allProducts.reduce((sum, p) => sum + (p.currentStock * (p.purchasePrice || 0)), 0);
    const lowStockCount = allProducts.filter(p => p.currentStock <= (p.reorderLevel || 0)).length;

    res.json({ inventory, total, totalStockValue, lowStockCount, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/inventory/adjust
export const adjustInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, type, quantity, reason, notes } = req.body;
    if (!productId || !type || !quantity || !reason) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const businessId = req.user!.businessId;
    const product = await Product.findOne({ _id: productId, businessId });
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }

    const qty = Number(quantity);
    const incValue = type === 'add' ? qty : -qty;

    if (type === 'subtract' && product.currentStock < qty) {
      res.status(400).json({ message: 'Cannot subtract more than current stock' });
      return;
    }

    // Perform adjustment
    product.currentStock += incValue;
    await product.save();

    // Log adjustment
    const adjustment = await InventoryAdjustment.create({
      businessId,
      productId,
      type,
      quantity: qty,
      reason,
      notes,
      createdBy: req.user!.userId,
    });

    res.status(201).json({ message: 'Inventory adjusted successfully', product, adjustment });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/inventory/adjustments
export const getAdjustments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const adjustments = await InventoryAdjustment.find({ businessId })
      .populate('productId', 'name sku unit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ adjustments });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/inventory/auto-sequence
export const autoSequenceBatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body; // Array of { productId, quantity }
    const businessId = req.user!.businessId;

    const business = await Business.findById(businessId);
    const strategy = business?.inventorySequencing || 'FIFO';

    const result = [];
    
    for (const item of items) {
      let remainingQty = Number(item.quantity);
      const allocatedBatches = [];

      // Sort criteria based on strategy
      let sortCriteria: any = { createdAt: 1 }; // Default FIFO
      if (strategy === 'FEFO') sortCriteria = { expiryDate: 1, createdAt: 1 };
      else if (strategy === 'LIFO') sortCriteria = { createdAt: -1 };

      const batches = await Batch.find({ 
        businessId, 
        productId: item.productId, 
        currentStock: { $gt: 0 }, 
        isActive: true,
        qualityStatus: { $ne: 'Failed' }
      }).sort(sortCriteria);

      for (const batch of batches) {
        if (remainingQty <= 0) break;

        const allocQty = Math.min(batch.currentStock, remainingQty);
        allocatedBatches.push({
          batchNo: batch.batchNo,
          allocatedQuantity: allocQty,
          mrp: batch.mrp,
          salePrice: batch.salePrice,
          qualityStatus: batch.qualityStatus
        });
        remainingQty -= allocQty;
      }

      result.push({
        productId: item.productId,
        requestedQuantity: item.quantity,
        unfulfilledQuantity: remainingQty,
        allocatedBatches
      });
    }

    res.json({ strategy, allocations: result });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/inventory/batch-alerts
export const getBatchAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    
    // 1. Expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringBatches = await Batch.find({
      businessId,
      isActive: true,
      currentStock: { $gt: 0 },
      expiryDate: { $lte: thirtyDaysFromNow }
    }).populate('productId', 'name sku').sort({ expiryDate: 1 });

    // 2. Low stock (<= 5)
    const lowStockBatches = await Batch.find({
      businessId,
      isActive: true,
      currentStock: { $gt: 0, $lte: 5 }
    }).populate('productId', 'name sku').sort({ currentStock: 1 });

    // 3. Failed quality
    const failedBatches = await Batch.find({
      businessId,
      isActive: true,
      currentStock: { $gt: 0 },
      qualityStatus: 'Failed'
    }).populate('productId', 'name sku');

    res.json({
      expiringBatches,
      lowStockBatches,
      failedBatches
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/inventory/batch-logs
export const getBatchLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchNo, productId, documentType } = req.query;
    const query: any = { businessId: req.user!.businessId };
    
    if (batchNo) query.batchNo = { $regex: batchNo, $options: 'i' };
    if (productId) query.productId = productId;
    if (documentType) query.documentType = documentType;

    const logs = await BatchLog.find(query)
      .populate('productId', 'name unit')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(500);
      
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
