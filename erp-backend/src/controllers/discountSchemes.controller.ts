import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import DiscountScheme from '../models/DiscountScheme.model';
import DiscountAuditLog from '../models/DiscountAuditLog.model';
import mongoose from 'mongoose';
import Business from '../models/Business.model';

// @desc    Get all discount schemes
// @route   GET /api/v1/discount-schemes
// @access  Private
export const getDiscountSchemes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.businessId;
    const schemes = await DiscountScheme.find({ businessId })
      .populate('applicability.products', 'name sku')
      .populate('applicability.customers', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: schemes.length, schemes });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get single discount scheme
// @route   GET /api/v1/discount-schemes/:id
// @access  Private
export const getDiscountScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const scheme = await DiscountScheme.findOne({ _id: req.params.id, businessId: req.user?.businessId })
      .populate('applicability.products', 'name sku')
      .populate('applicability.customers', 'name');
      
    if (!scheme) {
      res.status(404).json({ message: 'Discount scheme not found' });
      return;
    }
    res.json({ success: true, scheme });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Create discount scheme
// @route   POST /api/v1/discount-schemes
// @access  Private
export const createDiscountScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.businessId;
    
    // Check if code exists
    const existing = await DiscountScheme.findOne({ businessId, schemeCode: req.body.schemeCode });
    if (existing) {
      res.status(400).json({ message: 'Scheme code already exists' });
      return;
    }

    const schemeData = {
      ...req.body,
      businessId,
      createdBy: req.user?.userId
    };

    const scheme = await DiscountScheme.create(schemeData);
    
    // Audit log
    await DiscountAuditLog.create({
      businessId,
      userId: req.user?.userId,
      action: 'CREATED',
      schemeId: scheme._id,
      newValue: scheme
    });

    res.status(201).json({ success: true, scheme });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update discount scheme
// @route   PUT /api/v1/discount-schemes/:id
// @access  Private
export const updateDiscountScheme = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.businessId;
    let scheme = await DiscountScheme.findOne({ _id: req.params.id, businessId });

    if (!scheme) {
      res.status(404).json({ message: 'Discount scheme not found' });
      return;
    }
    
    const oldValues = scheme.toObject();

    scheme = await DiscountScheme.findOneAndUpdate(
      { _id: req.params.id, businessId },
      req.body,
      { new: true, runValidators: true }
    );

    // Audit log
    await DiscountAuditLog.create({
      businessId,
      userId: req.user?.userId,
      action: 'UPDATED',
      schemeId: scheme?._id,
      oldValue: oldValues,
      newValue: scheme
    });

    res.json({ success: true, scheme });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Change scheme status (Activate, Pause, Expire)
// @route   PUT /api/v1/discount-schemes/:id/status
// @access  Private
export const updateSchemeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const businessId = req.user?.businessId;
    
    const scheme = await DiscountScheme.findOneAndUpdate(
      { _id: req.params.id, businessId },
      { status },
      { new: true }
    );

    if (!scheme) {
      res.status(404).json({ message: 'Discount scheme not found' });
      return;
    }
    
    await DiscountAuditLog.create({
      businessId,
      userId: req.user?.userId,
      action: `STATUS_CHANGED_TO_${status}`,
      schemeId: scheme._id
    });

    res.json({ success: true, scheme });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Calculate applicable discounts
// @route   POST /api/v1/discount-schemes/calculate
// @access  Private
export const calculateDiscounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.businessId;
    const { items, customerId, invoiceTotal } = req.body;

    // Fetch all active/scheduled schemes 
    const now = new Date();
    const schemes = await DiscountScheme.find({ 
      businessId, 
      status: 'ACTIVE',
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $exists: false } },
        { startDate: { $exists: false }, endDate: { $gte: now } },
        { startDate: { $exists: false }, endDate: { $exists: false } }
      ]
    }).sort({ priority: -1 });

    // MVP Engine: Return the schemes that match date criteria as eligible, 
    // to prove the UI integration without building a full cart evaluation engine yet.
    const eligibleSchemes = schemes.map(s => ({
      schemeId: s._id,
      schemeName: s.schemeName,
      schemeType: s.schemeType,
      benefitSummary: s.schemeType === 'BUY_X_GET_Y' ? 'Reward Available' : 
                     s.schemeType === 'COMBO' ? 'Combo Applied' : 'Discount Applied'
    }));

    res.json({ 
      success: true, 
      eligibleSchemes,
      appliedSchemes: [],
      calculatedItems: items,
      totalDiscount: 0
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
