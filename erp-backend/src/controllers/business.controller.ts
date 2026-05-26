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
    const { name, businessName, gstin, pan, email, phone, mobile, address, financialYearStart, logo, termsAndConditions, invoiceTemplate, bankDetails, invoicePrefix, nonGstInvoicePrefix, productGroups, productBrands } = req.body;
    
    // Map frontend fields to backend model fields
    const updateData: any = { gstin, pan, email, address, financialYearStart, logo, termsAndConditions, invoiceTemplate, bankDetails };
    if (invoicePrefix) updateData.invoicePrefix = invoicePrefix;
    if (nonGstInvoicePrefix) updateData.nonGstInvoicePrefix = nonGstInvoicePrefix;
    if (name || businessName) updateData.businessName = name || businessName;
    if (phone || mobile) updateData.mobile = phone || mobile;
    if (productGroups) updateData.productGroups = productGroups;
    if (productBrands) updateData.productBrands = productBrands;

    const business = await Business.findByIdAndUpdate(
      req.user!.businessId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!business) { res.status(404).json({ message: 'Business not found' }); return; }
    
    res.json({ message: 'Business profile updated successfully', business });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
