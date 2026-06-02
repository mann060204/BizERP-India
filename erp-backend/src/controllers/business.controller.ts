import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Business from '../models/Business.model';

// GET /api/v1/business
export const getBusinessProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const business = await Business.findById(req.user!.businessId);
    if (!business) { res.status(404).json({ message: 'Business not found' }); return; }
    res.json({ business });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/business
export const updateBusinessProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const updateData: any = {};

    // Basic info
    if (body.name || body.businessName) updateData.businessName = body.name || body.businessName;
    if (body.ownerName) updateData.ownerName = body.ownerName;
    if (body.phone || body.mobile) updateData.mobile = body.phone || body.mobile;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.gstin !== undefined) updateData.gstin = body.gstin;
    if (body.pan !== undefined) updateData.pan = body.pan;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.financialYearStart !== undefined) updateData.financialYearStart = body.financialYearStart;
    if (body.termsAndConditions !== undefined) updateData.termsAndConditions = body.termsAndConditions;
    if (body.invoiceTemplate !== undefined) updateData.invoiceTemplate = body.invoiceTemplate;
    if (body.isCompositionScheme !== undefined) updateData.isCompositionScheme = body.isCompositionScheme;
    if (body.businessType !== undefined) updateData.businessType = body.businessType;

    // Invoice numbering
    if (body.invoicePrefix) updateData.invoicePrefix = body.invoicePrefix;
    if (body.nonGstInvoicePrefix) updateData.nonGstInvoicePrefix = body.nonGstInvoicePrefix;
    if (body.quotationPrefix) updateData.quotationPrefix = body.quotationPrefix;
    if (body.nonGstQuotationPrefix) updateData.nonGstQuotationPrefix = body.nonGstQuotationPrefix;

    // Bank details
    if (body.bankDetails !== undefined) updateData.bankDetails = body.bankDetails;

    // Master data — all arrays
    if (body.units !== undefined) updateData.units = body.units;
    if (body.expenseCategories !== undefined) updateData.expenseCategories = body.expenseCategories;
    if (body.holidays !== undefined) updateData.holidays = body.holidays;
    if (body.discountSchemes !== undefined) updateData.discountSchemes = body.discountSchemes;
    if (body.productGroups !== undefined) updateData.productGroups = body.productGroups;
    if (body.productBrands !== undefined) updateData.productBrands = body.productBrands;
    if (body.productCategories !== undefined) updateData.productCategories = body.productCategories;

    const business = await Business.findByIdAndUpdate(
      req.user!.businessId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!business) { res.status(404).json({ message: 'Business not found' }); return; }
    res.json({ message: 'Business profile updated successfully', business });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/business/sequences
export const updateSequences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sequences } = req.body; // Expecting an object or array of sequences
    
    // Construct $set update object for Map
    const updateData: any = {};
    for (const [key, config] of Object.entries(sequences)) {
      updateData[`documentSequences.${key}`] = config;
    }

    const business = await Business.findByIdAndUpdate(
      req.user!.businessId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!business) { res.status(404).json({ message: 'Business not found' }); return; }
    res.json({ message: 'Sequences updated successfully', documentSequences: business.documentSequences });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

