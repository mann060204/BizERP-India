import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: 'd:/ERP WEBSITE/erp-backend/.env' });

// We need to run this from erp-backend to load models
const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/biz-erp');
  console.log("Connected to MongoDB.");
  
  const { Product } = require('./src/models/Product.model');
  const { AccountLedger } = require('./src/models/AccountLedger.model');
  const { Account } = require('./src/models/Account.model');
  const { Invoice } = require('./src/models/Invoice.model');

  console.log("Products:", await Product.countDocuments());
  console.log("AccountLedgers:", await AccountLedger.countDocuments());
  console.log("Accounts:", await Account.countDocuments());
  console.log("Invoices:", await Invoice.countDocuments());

  mongoose.disconnect();
};

run().catch(console.error);
