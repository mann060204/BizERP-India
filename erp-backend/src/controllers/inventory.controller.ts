import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Product from '../models/Product.model';
import InventoryAdjustment from '../models/InventoryAdjustment.model';

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
    const allProducts = await Product.find({ businessId, type: 'product', isActive: true }, 'currentStock purchasePrice');
    const totalStockValue = allProducts.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
    const lowStockCount = allProducts.filter(p => p.currentStock <= (p as any).reorderLevel).length;

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
