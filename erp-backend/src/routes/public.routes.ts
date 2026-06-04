import { Router } from 'express';
import Invoice from '../models/Invoice.model';
import Quotation from '../models/Quotation.model';
import Business from '../models/Business.model';
import Customer from '../models/Customer.model';
import User from '../models/User.model';
import PurchaseOrder from '../models/PurchaseOrder.model';
import PurchaseBill from '../models/PurchaseBill.model';

const router = Router();

router.get('/invoice/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      res.status(400).json({ message: 'Invalid Invoice ID' });
      return;
    }

    const invoice = await Invoice.findById(id)
      .populate('customerId', 'name mobile email gstin billingAddress')
      .populate('createdBy', 'name');
      
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }
    
    let business = null;
    if (invoice.businessId) {
      business = await Business.findById(invoice.businessId).catch(() => null);
    }

    res.json({ invoice, business });
  } catch (e: any) { 
    console.error('PUBLIC INVOICE ERR:', e);
    // Do not crash the fetch entirely if it's a CastError, just return 404
    if (e.name === 'CastError') {
      res.status(404).json({ message: 'Invoice not found' });
    } else {
      res.status(500).json({ message: e.message }); 
    }
  }
});

router.get('/quotation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      res.status(400).json({ message: 'Invalid Quotation ID' });
      return;
    }

    const quotation = await Quotation.findById(id)
      .populate('customerId', 'name mobile email gstin billingAddress')
      .populate('createdBy', 'name');
      
    if (!quotation) {
      res.status(404).json({ message: 'Quotation not found' });
      return;
    }
    
    let business = null;
    if (quotation.businessId) {
      business = await Business.findById(quotation.businessId).catch(() => null);
    }
    
    res.json({ quotation, business });
  } catch (e: any) { 
    console.error('PUBLIC QUOTATION ERR:', e);
    if (e.name === 'CastError') {
      res.status(404).json({ message: 'Quotation not found' });
    } else {
      res.status(500).json({ message: e.message }); 
    }
  }
});

router.get('/purchase-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      res.status(400).json({ message: 'Invalid Purchase Order ID' });
      return;
    }

    const order = await PurchaseOrder.findById(id).populate('createdBy', 'name');
      
    if (!order) {
      res.status(404).json({ message: 'Purchase Order not found' });
      return;
    }
    
    let business = null;
    if (order.businessId) {
      business = await Business.findById(order.businessId).catch(() => null);
    }
    
    res.json({ order, business });
  } catch (e: any) { 
    console.error('PUBLIC PURCHASE ORDER ERR:', e);
    if (e.name === 'CastError') {
      res.status(404).json({ message: 'Purchase Order not found' });
    } else {
      res.status(500).json({ message: e.message }); 
    }
  }
});

router.get('/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      res.status(400).json({ message: 'Invalid Purchase Bill ID' });
      return;
    }

    const purchase = await PurchaseBill.findById(id).populate('createdBy', 'name');
      
    if (!purchase) {
      res.status(404).json({ message: 'Purchase Bill not found' });
      return;
    }
    
    let business = null;
    if (purchase.businessId) {
      business = await Business.findById(purchase.businessId).catch(() => null);
    }
    
    res.json({ purchase, business });
  } catch (e: any) { 
    console.error('PUBLIC PURCHASE BILL ERR:', e);
    if (e.name === 'CastError') {
      res.status(404).json({ message: 'Purchase Bill not found' });
    } else {
      res.status(500).json({ message: e.message }); 
    }
  }
});

export default router;
