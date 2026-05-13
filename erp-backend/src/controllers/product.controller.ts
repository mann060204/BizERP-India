import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Product from '../models/Product.model';

// GET /api/v1/products
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, type, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId, isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);
    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/products/:id
export const getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
    res.json({ product });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/products
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = { ...req.body, businessId: req.user!.businessId };
    data.currentStock = data.openingStock || 0;
    const product = await Product.create(data);
    res.status(201).json({ message: 'Product created', product });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/products/:id
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
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
