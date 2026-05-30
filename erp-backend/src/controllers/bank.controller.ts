import { Request, Response } from 'express';
import Bank from '../models/Bank.model';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getBanks = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const banks = await Bank.find({ businessId }).sort({ createdAt: -1 });
    res.json({ success: true, data: banks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

export const getBankById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bank = await Bank.findOne({ _id: req.params.id, businessId: req.user?.businessId });
    if (!bank) {
      res.status(404).json({ success: false, message: 'Bank not found' });
      return;
    }
    res.json({ success: true, data: bank });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

export const createBank = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const bank = new Bank({ ...req.body, businessId });
    await bank.save();
    res.status(201).json({ success: true, data: bank });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create bank', error });
  }
};

export const updateBank = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bank = await Bank.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user?.businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!bank) {
      res.status(404).json({ success: false, message: 'Bank not found' });
      return;
    }
    res.json({ success: true, data: bank });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to update bank', error });
  }
};

export const deleteBank = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // In a real system, you might want to prevent deletion if the bank has transactions.
    const bank = await Bank.findOneAndDelete({ _id: req.params.id, businessId: req.user?.businessId });
    if (!bank) {
      res.status(404).json({ success: false, message: 'Bank not found' });
      return;
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};
