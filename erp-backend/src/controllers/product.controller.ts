import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Product from '../models/Product.model';
import Batch from '../models/Batch.model';

// GET /api/v1/products
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, type, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId, isActive: true };
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: regex },
        { sku: regex },
        { barcode: regex },
        { brand: regex },
        { category: regex },
        { batchNo: regex }
      ];
    }
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit)).lean(),
      Product.countDocuments(query),
    ]);

    const productIds = products.map(p => p._id);
    const batches = await Batch.find({ businessId, productId: { $in: productIds }, currentStock: { $gt: 0 }, isActive: true }).lean();

    const productsWithBatches = products.map(p => {
      return {
        ...p,
        availableBatches: batches.filter(b => String(b.productId) === String(p._id))
      };
    });

    res.json({ products: productsWithBatches, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/products/:id
export const getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const product = await Product.findOne({ _id: req.params['id'], businessId }).lean();
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
    const productBatches = await Batch.find({ businessId, productId: product._id, isActive: true }).lean();
    res.json({ product: { ...product, batches: productBatches } });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/products
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = { ...req.body, businessId: req.user!.businessId };
    data.currentStock = data.openingStock || 0;
    const product = await Product.create(data);

    // If batch-tracked with opening stock, create the "Opening Stock" batch automatically
    if (product.enableTracking && product.openingStock > 0) {
      await Batch.create({
        businessId: product.businessId,
        productId: product._id,
        batchNo: 'Opening Stock',
        currentStock: product.openingStock,
        salePrice: product.sellingPrice,
        mrp: product.mrp ?? product.sellingPrice,
        qualityStatus: 'Passed',
        isActive: true,
      });
    }

    res.status(201).json({ message: 'Product created', product });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/products/:id
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const productId = req.params['id'];
    const update: any = { ...req.body };

    // Load current product to detect what changed
    const old = await Product.findOne({ _id: productId, businessId }).lean();
    if (!old) { res.status(404).json({ message: 'Product not found' }); return; }

    // ── Opening Stock sync ──────────────────────────────────────────────────
    // If openingStock is being explicitly set, cast it to a number first
    if (update.openingStock !== undefined) {
      const newOS = Number(update.openingStock) || 0;
      update.openingStock = newOS;

      // Sync currentStock only when no transactions have modified it yet.
      // Heuristic: if currentStock still equals the old openingStock, the item
      // is "pristine" (no purchases/sales processed) → safe to update currentStock.
      if (Number(old.currentStock) === Number(old.openingStock)) {
        update.currentStock = newOS;
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, businessId },
      update,
      { new: true, runValidators: true }
    );
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }

    // ── Batch-tracked items: upsert "Opening Stock" batch ───────────────────
    // When enableTracking is ON, the stock column is driven by batch records.
    // We must upsert an "Opening Stock" batch so the list reflects the entered qty.
    const isTracked = (update.enableTracking ?? old.enableTracking) === true;
    if (isTracked && update.openingStock !== undefined) {
      const qty = Number(update.openingStock) || 0;

      await Batch.findOneAndUpdate(
        { businessId, productId: product._id, batchNo: 'Opening Stock' },
        {
          $setOnInsert: {
            businessId,
            productId: product._id,
            batchNo: 'Opening Stock',
          },
          $set: {
            currentStock: qty,
            salePrice: product.sellingPrice,
            mrp: product.mrp ?? product.sellingPrice,
            qualityStatus: 'Passed',
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );

      // Keep product.currentStock in sync so the item-list stock column is correct
      // (the list reads p.currentStock, not a batch aggregation)
      await Product.updateOne({ _id: product._id }, { $set: { currentStock: qty } });
      (product as any).currentStock = qty; // reflect in the API response too
    }

    res.json({ message: 'Product updated', product });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/products/:id
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Product.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      { isActive: false }
    );
    res.json({ message: 'Product deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/products/bulk
export const createBulkProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = req.body.products || [];
    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ message: 'Valid array of products is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const bulkData = products.map((p: any) => ({
      ...p,
      businessId,
      currentStock: p.openingStock || 0,
    }));

    const inserted = await Product.insertMany(bulkData);
    res.status(201).json({ message: `${inserted.length} products imported successfully`, insertedCount: inserted.length });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
