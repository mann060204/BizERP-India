const fs = require('fs');
const file = 'd:/ERP WEBSITE/erp-backend/src/controllers/customer.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const newGetCustomers = `export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '50' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId, isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { tradeName: { $regex: search, $options: 'i' } },
        { 'billingAddress.city': { $regex: search, $options: 'i' } },
        { 'billingAddress.state': { $regex: search, $options: 'i' } },
        { 'billingAddress.street': { $regex: search, $options: 'i' } },
        { 'billingAddress.pinCode': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Use aggregation to attach currentBalance dynamically
    const pipeline: any[] = [{ $match: query }];
    pipeline.push({ $sort: { name: 1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });
    
    pipeline.push({
      $lookup: {
        from: 'invoices',
        localField: '_id',
        foreignField: 'customerId',
        as: 'invoices'
      }
    });
    
    pipeline.push({
      $addFields: {
        totalInvoiceBalance: { $sum: '$invoices.balance' }
      }
    });
    
    pipeline.push({
      $addFields: {
        currentBalance: { $add: ['$openingBalance', '$totalInvoiceBalance'] }
      }
    });
    
    pipeline.push({
      $project: { invoices: 0, totalInvoiceBalance: 0 }
    });

    const [customers, total] = await Promise.all([
      Customer.aggregate(pipeline),
      Customer.countDocuments(query),
    ]);
    
    res.json({ customers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};`;

content = content.replace(/export const getCustomers = async \([^]*?res\.status\(500\)\.json\(\{ message: error\.message \}\);\r?\n  \}\r?\n\};/, newGetCustomers);
fs.writeFileSync(file, content);
console.log('Fixed customer controller');
