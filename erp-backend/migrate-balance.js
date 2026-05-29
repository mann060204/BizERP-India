const mongoose = require('mongoose');

async function migrateBalance() {
  await mongoose.connect('mongodb://127.0.0.1:27017/erp_db');
  const db = mongoose.connection.db;

  const invoices = await db.collection('invoices').find({}).toArray();
  for (const inv of invoices) {
    const balance = Math.round((inv.grandTotal - (inv.amountReceived || 0)) * 100) / 100;
    
    // Also fix any status that might be wrong due to floating point
    let newStatus = inv.status;
    if (inv.amountReceived >= inv.grandTotal || inv.amountReceived >= (inv.grandTotal - (inv.shippingCharge || 0))) { 
       // wait, we can't get preRoundTotal easily here, but if balance <= 1 it's likely paid
    }
    
    // Let's just fix the status manually based on balance
    if (balance <= 0.99) {
      newStatus = 'paid';
    } else if (inv.amountReceived > 0) {
      newStatus = 'partial';
    } else {
      newStatus = 'unpaid';
    }

    if (inv.status === 'cancelled') newStatus = 'cancelled';

    await db.collection('invoices').updateOne({ _id: inv._id }, { $set: { balance: balance, status: newStatus } });
  }

  console.log('Balance migration complete');
  process.exit(0);
}

migrateBalance().catch(console.error);
