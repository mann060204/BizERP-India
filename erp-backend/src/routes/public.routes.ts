import { Router } from 'express';
import Invoice from '../models/Invoice.model';
import Quotation from '../models/Quotation.model';
import Business from '../models/Business.model';
import Customer from '../models/Customer.model';
import User from '../models/User.model';

const router = Router();

router.get('/invoice/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name mobile email gstin billingAddress')
      .populate('createdBy', 'name');
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }
    
    const business = await Business.findById(invoice.businessId);
    res.json({ invoice, business });
  } catch (e: any) { 
    console.error('PUBLIC INVOICE ERR:', e);
    res.status(500).json({ message: e.message }); 
  }
});

router.get('/quotation/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customerId', 'name mobile email gstin billingAddress')
      .populate('createdBy', 'name');
    if (!quotation) { res.status(404).json({ message: 'Quotation not found' }); return; }
    
    const business = await Business.findById(quotation.businessId);
    res.json({ quotation, business });
  } catch (e: any) { 
    res.status(500).json({ message: e.message }); 
  }
});

export default router;
