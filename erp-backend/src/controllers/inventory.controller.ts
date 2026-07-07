import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Product from '../models/Product.model';
import InventoryAdjustment from '../models/InventoryAdjustment.model';
import Batch from '../models/Batch.model';
import BatchLog from '../models/BatchLog.model';
import Business from '../models/Business.model';
import mongoose from 'mongoose';

// GET /api/v1/inventory
export const getInventoryLevels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, lowStock, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId, type: 'product', isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
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
    const { productId, type, quantity, reason, notes, batchNo, location } = req.body;
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

    // Perform product-level adjustment
    product.currentStock += incValue;
    if (location && (!batchNo || !batchNo.trim())) {
      product.location = location.trim();
    }
    await product.save();

    // If batchNo is provided, also adjust batch-level stock
    if (batchNo && batchNo.trim()) {
      const batchUpdate: any = { $inc: { currentStock: incValue } };
      if (location) {
        batchUpdate.$set = { location: location.trim() };
      }
      
      const updatedBatch = await Batch.findOneAndUpdate(
        { businessId, productId, batchNo: batchNo.trim() },
        batchUpdate,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (updatedBatch) {
        await BatchLog.create({
          businessId,
          batchId: updatedBatch._id,
          productId,
          action: type === 'add' ? 'STOCK_IN' : 'STOCK_OUT',
          quantityChanged: incValue,
          currentStock: updatedBatch.currentStock,
          documentType: 'Adjustment',
          documentNumber: `ADJ-${reason}`,
          userId: req.user!.userId,
        });
      }
    }

    // Log adjustment
    const adjustment = await InventoryAdjustment.create({
      businessId,
      productId,
      type,
      quantity: qty,
      batchNo: batchNo?.trim() || undefined,
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

// GET /api/v1/inventory/batches
export const listBatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { search, productId } = req.query as any;

    const query: any = { businessId, isActive: true };
    if (productId) query.productId = productId;

    const batches = await Batch.find(query)
      .populate('productId', 'name sku unit')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // If search is provided, filter by product name or batch number
    let filtered = batches;
    if (search) {
      const regex = new RegExp(search, 'i');
      filtered = batches.filter((b: any) =>
        regex.test(b.batchNo) || regex.test(b.productId?.name || '')
      );
    }

    res.json({ batches: filtered });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/v1/inventory/batches
export const saveBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, batchNo, quantity, salePrice, manufacturingDate, expiryDate, mrp } = req.body;
    const businessId = req.user!.businessId;

    if (!productId || !batchNo) {
      res.status(400).json({ message: 'Product and Batch No. are required' });
      return;
    }

    // Verify product exists
    const product = await Product.findOne({ _id: productId, businessId });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const qty = Number(quantity) || 0;

    const updateDoc: any = {
      $set: {
        mrp: Number(mrp) || Number(salePrice) || 0,
        salePrice: Number(salePrice) || 0,
        isActive: true,
      }
    };

    if (manufacturingDate) updateDoc.$set.manufacturingDate = new Date(manufacturingDate);
    if (expiryDate) updateDoc.$set.expiryDate = new Date(expiryDate);

    // Check if batch already exists
    const existingBatch = await Batch.findOne({ businessId, productId, batchNo: batchNo.trim() });

    if (existingBatch) {
      // Update existing batch - add quantity to current stock
      if (qty > 0) updateDoc.$inc = { currentStock: qty };
      const updatedBatch = await Batch.findOneAndUpdate(
        { businessId, productId, batchNo: batchNo.trim() },
        updateDoc,
        { new: true }
      );

      // Also update product stock
      if (qty > 0) {
        await Product.findByIdAndUpdate(productId, { $inc: { currentStock: qty } });
      }

      // Create batch log
      if (updatedBatch && qty > 0) {
        await BatchLog.create({
          businessId,
          batchId: updatedBatch._id,
          productId,
          action: 'STOCK_IN',
          quantityChanged: qty,
          currentStock: updatedBatch.currentStock,
          documentType: 'Manual',
          documentNumber: `BATCH-${batchNo.trim()}`,
          userId: req.user!.userId,
        });
      }

      res.json({ message: 'Batch updated', batch: updatedBatch });
    } else {
      // Create new batch
      const newBatch = await Batch.create({
        businessId,
        productId,
        batchNo: batchNo.trim(),
        mrp: Number(mrp) || Number(salePrice) || 0,
        salePrice: Number(salePrice) || 0,
        salePrice2: Number(req.body.salePrice2) || 0,
        salePrice3: Number(req.body.salePrice3) || 0,
        box: req.body.box?.trim() || '',
        location: req.body.location?.trim() || '',
        currentStock: qty,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        isActive: true,
      });

      // Also update product stock
      if (qty > 0) {
        await Product.findByIdAndUpdate(productId, { $inc: { currentStock: qty } });
      }

      // Create batch log
      if (qty > 0) {
        await BatchLog.create({
          businessId,
          batchId: newBatch._id,
          productId,
          action: 'STOCK_IN',
          quantityChanged: qty,
          currentStock: newBatch.currentStock,
          documentType: 'Manual',
          documentNumber: `BATCH-${batchNo.trim()}`,
          userId: req.user!.userId,
        });
      }

      res.status(201).json({ message: 'Batch created', batch: newBatch });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/v1/inventory/batches/:id
export const updateBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId;
    const { batchNo, salePrice, salePrice2, salePrice3, mrp, box, location, manufacturingDate, expiryDate } = req.body;

    const batch = await Batch.findOne({ _id: id, businessId });
    if (!batch) { res.status(404).json({ message: 'Batch not found' }); return; }

    const updateFields: any = {};
    if (batchNo !== undefined) updateFields.batchNo = batchNo.trim();
    if (salePrice !== undefined) updateFields.salePrice = Number(salePrice) || 0;
    if (salePrice2 !== undefined) updateFields.salePrice2 = Number(salePrice2) || 0;
    if (salePrice3 !== undefined) updateFields.salePrice3 = Number(salePrice3) || 0;
    if (mrp !== undefined) updateFields.mrp = Number(mrp) || 0;
    if (box !== undefined) updateFields.box = box.trim();
    if (location !== undefined) updateFields.location = location.trim();
    if (manufacturingDate !== undefined) updateFields.manufacturingDate = manufacturingDate ? new Date(manufacturingDate) : null;
    if (expiryDate !== undefined) updateFields.expiryDate = expiryDate ? new Date(expiryDate) : null;

    const updated = await Batch.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
      .populate('productId', 'name sku unit');

    res.json({ message: 'Batch updated successfully', batch: updated });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/inventory/batches/:id
export const deleteBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const businessId = req.user!.businessId;

    const batch = await Batch.findOne({ _id: id, businessId });
    if (!batch) {
      res.status(404).json({ message: 'Batch not found' });
      return;
    }

    // Deduct the batch's current stock from the product total
    if (batch.currentStock > 0) {
      await Product.findByIdAndUpdate(batch.productId, {
        $inc: { currentStock: -batch.currentStock },
      });
    }

    await Batch.findByIdAndDelete(id);

    res.json({ message: 'Batch deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

// POST /api/v1/inventory/bulk-import
export const bulkImportInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      res.status(400).json({ message: 'records array is required' });
      return;
    }

    const businessId = req.user!.businessId;
    let createdProducts = 0;
    let updatedProducts = 0;
    let createdBatches = 0;
    let updatedBatches = 0;
    const errors: string[] = [];

    for (const row of records) {
      try {
        // --- Find or create product ---
        const sku = (row.SKU || row.sku || '').trim();
        const name = (row.Name || row.name || '').trim();
        if (!name) { errors.push(`Skipped row: Name is required`); continue; }

        let product: any = null;
        if (sku) {
          product = await Product.findOne({ businessId, sku, isActive: true });
        }
        if (!product) {
          product = await Product.findOne({ businessId, name, isActive: true });
        }

        const productData: any = {
          name,
          printName: row['Print Name'] || row.printName || '',
          sku: sku || undefined,
          category: row.Category || row.category || '',
          group: row.Group || row.group || '',
          brand: row.Brand || row.brand || '',
          unit: row.Unit || row.unit || 'Nos',
          secondaryUnit: row['Secondary Unit'] || row.secondaryUnit || '',
          conversionRate: parseFloat(row['Conversion Rate'] || row.conversionRate || '1') || 1,
          sellingPrice: parseFloat(row['Selling Price'] || row.sellingPrice || '0') || 0,
          purchasePrice: parseFloat(row['Purchase Price'] || row.purchasePrice || '0') || 0,
          mrp: parseFloat(row['MRP'] || row.mrp || '0') || 0,
          saleDiscount: parseFloat(row['Sale Discount'] || row.saleDiscount || '0') || 0,
          saleDiscountType: (row['Discount Type'] || row.saleDiscountType || 'percentage').toLowerCase(),
          gstRate: parseFloat(row['GST %'] || row.gstRate || '0') || 0,
          hsnCode: row['HSN Code'] || row.hsnCode || '',
          location: row['Location'] || row.location || '',
          reorderLevel: parseFloat(row['Reorder Level'] || row.reorderLevel || '5') || 5,
          lowLevelLimit: parseFloat(row['Low Level Limit'] || row.lowLevelLimit || '0') || 0,
        };

        const batchNo = (row['Batch No'] || row.batchNo || row['Batch Number'] || '').trim();
        const batchStock = parseFloat(row['Batch Stock'] || row.batchStock || '0') || 0;
        const hasValidBatch = batchNo.length > 0;

        if (!product) {
          // Create new product
          const openingStock = hasValidBatch ? 0 : (parseFloat(row['Stock'] || row.openingStock || '0') || 0);
          const newProduct = await Product.create({
            ...productData,
            businessId,
            type: 'product',
            openingStock,
            currentStock: openingStock,
            isActive: true,
          });
          product = newProduct;
          createdProducts++;
        } else {
          // Update existing product fields (except stock — handled via batches or separately)
          await Product.findByIdAndUpdate(product._id, productData);
          updatedProducts++;
        }

        // --- Handle batch ---
        if (hasValidBatch) {
          const batchUpdate: any = {
            $set: {
              salePrice: parseFloat(row['Batch Sale Price'] || row['Selling Price'] || row.sellingPrice || '0') || 0,
              mrp: parseFloat(row['Batch MRP'] || row['MRP'] || row.mrp || '0') || 0,
              isActive: true,
            }
          };
          const mfgDate = row['Mfg Date'] || row['Manufacturing Date'] || row.manufacturingDate || '';
          const expDate = row['Expiry Date'] || row.expiryDate || '';
          if (mfgDate) batchUpdate.$set.manufacturingDate = new Date(mfgDate);
          if (expDate) batchUpdate.$set.expiryDate = new Date(expDate);

          const existingBatch = await Batch.findOne({ businessId, productId: product._id, batchNo });
          if (existingBatch) {
            const diff = batchStock - existingBatch.currentStock;
            if (diff !== 0) batchUpdate.$inc = { currentStock: diff };
            await Batch.findByIdAndUpdate(existingBatch._id, batchUpdate, { new: true });
            if (diff !== 0) {
              await Product.findByIdAndUpdate(product._id, { $inc: { currentStock: diff } });
            }
            updatedBatches++;
          } else {
            await Batch.create({
              businessId,
              productId: product._id,
              batchNo,
              currentStock: batchStock,
              salePrice: parseFloat(row['Batch Sale Price'] || row['Selling Price'] || row.sellingPrice || '0') || 0,
              mrp: parseFloat(row['Batch MRP'] || row['MRP'] || row.mrp || '0') || 0,
              manufacturingDate: mfgDate ? new Date(mfgDate) : undefined,
              expiryDate: expDate ? new Date(expDate) : undefined,
              isActive: true,
            });
            if (batchStock > 0) {
              await Product.findByIdAndUpdate(product._id, { $inc: { currentStock: batchStock } });
            }
            createdBatches++;
          }
        }
      } catch (rowErr: any) {
        errors.push(`Row error (${row.Name || row.name || 'unknown'}): ${rowErr.message}`);
      }
    }

    res.status(200).json({
      message: `Import complete. ${createdProducts} products created, ${updatedProducts} updated, ${createdBatches} batches created, ${updatedBatches} batches updated.`,
      createdProducts, updatedProducts, createdBatches, updatedBatches,
      errors: errors.slice(0, 20),
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
