import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/ERP WEBSITE/erp-backend/.env' });

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/biz-erp');
  console.log("Connected to MongoDB.");
  
  const Business = require('./src/models/Business.model').default;
  const Product = require('./src/models/Product.model').default;
  const AccountLedger = require('./src/models/AccountLedger.model').default;
  const Invoice = require('./src/models/Invoice.model').default;

  const businesses = await Business.find({});
  console.log("Total Businesses:", businesses.length);
  
  for (const b of businesses) {
      console.log(`\nBusiness: ${b.companyName} (${b._id})`);
      const prodCount = await Product.countDocuments({ businessId: b._id });
      const ledgerCount = await AccountLedger.countDocuments({ businessId: b._id });
      const invCount = await Invoice.countDocuments({ businessId: b._id });
      console.log(`  Products: ${prodCount}`);
      console.log(`  Ledgers: ${ledgerCount}`);
      console.log(`  Invoices: ${invCount}`);
  }

  mongoose.disconnect();
};

run().catch(console.error);
