import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Customer from '../models/Customer.model';

// GET /api/v1/customers
export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId, isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
      Customer.countDocuments(query),
    ]);
    res.json({ customers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/customers/:id
export const getCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
    res.json({ customer });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/customers
export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await Customer.create({ ...req.body, businessId: req.user!.businessId });
    res.status(201).json({ message: 'Customer created', customer });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/customers/:id
export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
    res.json({ message: 'Customer updated', customer });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/customers/:id
export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Customer.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      { isActive: false }
    );
    res.json({ message: 'Customer deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/customers/bulk
export const createBulkCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customers = req.body.customers || [];
    if (!Array.isArray(customers) || customers.length === 0) {
      res.status(400).json({ message: 'Valid array of customers is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const bulkData = customers.map((c: any) => ({
      ...c,
      businessId,
    }));

    const inserted = await Customer.insertMany(bulkData);
    res.status(201).json({ message: `${inserted.length} customers imported successfully`, insertedCount: inserted.length });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
