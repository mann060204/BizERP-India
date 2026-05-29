const fs = require('fs');
const path = require('path');

// Fix quotation.controller.ts
const qctrlPath = path.join(__dirname, 'src', 'controllers', 'quotation.controller.ts');
let qctrl = fs.readFileSync(qctrlPath, 'utf8');

qctrl = qctrl.replace(/calculateQuotationTotals/g, 'calculateInvoiceTotals'); // use the existing invoice calculator for totals
qctrl = qctrl.replace(/\{ \$ne: "cancelled" \}/g, '{ $ne: "Cancelled" }');
qctrl = qctrl.replace(/export const getQuotationById/g, 'export const getQuotation'); // align with routes
qctrl = qctrl.replace(/export const cancelQuotation/g, 'export const deleteQuotation'); // or we just change routes to cancelQuotation
qctrl = qctrl.replace(/quotationType/g, 'invoiceType'); // actually, let's keep it but wait, filter typing needs invoiceType probably, wait, let's change quotationType to invoiceType in getQuotations filter? No, let's check Quotation.model.ts for quotationType. I replaced invoiceType with quotationType. 

// Actually, Quotation.model.ts has quotationType, so the filter should be fine if we removed strict mode or we can use `as any`.
qctrl = qctrl.replace(/const filter: any =/g, 'const filter: any =');
if (!qctrl.includes('const filter: any =')) {
  qctrl = qctrl.replace(/const filter: \{\s*businessId/g, 'const filter: any = {\n    businessId');
}

// Fix paymentMode, amountReceived, balance that don't exist
qctrl = qctrl.replace(/amountReceived/g, '0'); // remove references or just cast as any if we need
qctrl = qctrl.replace(/paymentMode/g, '"Cash"');
qctrl = qctrl.replace(/quotation\.balance/g, '0');
qctrl = qctrl.replace(/status: \(totalAmountReceived/g, '// status');

// Well, since we replaced 'invoice' with 'quotation', some methods like getSalesSummary should be removed entirely since they don't apply to Quotation.
// Let's just create a clean quotation.controller.ts
const cleanController = `import { Request, Response } from 'express';
import Quotation from '../models/Quotation.model';
import Business from '../models/Business.model';
import { calculateInvoiceTotals } from '../services/gst.service';

export const getQuotations = async (req: Request, res: Response) => {
  try {
    const quotations = await Quotation.find({ businessId: (req as any).user.businessId }).sort({ createdAt: -1 }).populate('customerId', 'name');
    res.json(quotations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, businessId: (req as any).user.businessId });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const data = req.body;
    
    // Auto increment logic
    const business = await Business.findById(businessId);
    if (business) {
      if (data.quotationType === 'NON-GST') {
        business.nonGstQuotationCounter = (business.nonGstQuotationCounter || 1) + 1;
      } else {
        business.quotationCounter = (business.quotationCounter || 1) + 1;
      }
      await business.save();
    }
    
    const quotation = new Quotation({ ...data, businessId });
    const createdQuotation = await quotation.save();
    res.status(201).json(createdQuotation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, businessId: (req as any).user.businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, businessId: (req as any).user.businessId },
      { status: 'Cancelled' },
      { new: true }
    );
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ message: 'Quotation cancelled' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNextQuotationNumber = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const type = req.query.type as string;
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    
    const prefix = type === 'NON-GST' ? (business.nonGstQuotationPrefix || 'EST-') : (business.quotationPrefix || 'QUT-');
    const counter = type === 'NON-GST' ? (business.nonGstQuotationCounter || 1) : (business.quotationCounter || 1);
    
    const nextNumber = \`\${prefix}\${new Date().getFullYear()}-\${counter.toString().padStart(4, '0')}\`;
    res.json({ nextInvoiceNumber: nextNumber });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
`;

fs.writeFileSync(qctrlPath, cleanController, 'utf8');

// Fix routes
const qroutesPath = path.join(__dirname, 'src', 'routes', 'quotation.routes.ts');
const routesCode = `import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation, getNextQuotationNumber
} from '../controllers/quotation.controller';

const router = Router();

router.use(protect);

router.get('/next-number', getNextQuotationNumber);
router.get('/', getQuotations);
router.get('/:id', getQuotation);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

export default router;
`;
fs.writeFileSync(qroutesPath, routesCode, 'utf8');

console.log('quotation.controller.ts and routes rebuilt successfully');
