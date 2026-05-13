import { Request, Response } from 'express';
import Business from '../models/Business.model';
import User from '../models/User.model';
import { generateToken } from '../utils/jwt';

// @desc   Register a new business + admin user
// @route  POST /api/v1/auth/register
// @access Public
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      businessName, ownerName, gstin, pan, mobile, email, password,
      businessType, address, financialYearStart, invoicePrefix, bankDetails, isCompositionScheme,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists' });
      return;
    }

    // Check GSTIN uniqueness if provided
    if (gstin) {
      const existingBusiness = await Business.findOne({ gstin });
      if (existingBusiness) {
        res.status(400).json({ message: 'A business with this GSTIN already exists' });
        return;
      }
    }

    // Create Business
    const business = await Business.create({
      businessName, ownerName, gstin, pan, mobile, email,
      businessType: businessType || 'Retail',
      address: address || {},
      financialYearStart: financialYearStart || 4,
      invoicePrefix: invoicePrefix || 'INV',
      bankDetails: bankDetails || {},
      isCompositionScheme: isCompositionScheme || false,
    });

    // Create Admin User
    const user = await User.create({
      name: ownerName,
      email,
      password,
      role: 'admin',
      businessId: business._id,
    });

    const token = generateToken(
      (user._id as any).toString(),
      (business._id as any).toString(),
      user.role
    );

    res.status(201).json({
      message: 'Business registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      business: { id: business._id, businessName: business.businessName, gstin: business.gstin },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Login user
// @route  POST /api/v1/auth/login
// @access Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated. Contact your admin.' });
      return;
    }

    const token = generateToken(
      (user._id as any).toString(),
      user.businessId.toString(),
      user.role
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      businessId: user.businessId,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get current logged-in user profile
// @route  GET /api/v1/auth/me
// @access Private
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.userId).select('-password').populate('businessId');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Change password
// @route  PUT /api/v1/auth/change-password
// @access Private
export const changePassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user || !(await user.comparePassword(oldPassword))) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
