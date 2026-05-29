const mongoose = require('mongoose');

async function migrateSentInvoices() {
  await mongoose.connect('mongodb://127.0.0.1:27017/erp_db');
  const db = mongoose.connection.db;

  const invoices = await db.collection('invoices').find({ status: 'sent' }).toArray();
  for (const inv of invoices) {
    let newStatus = 'unpaid';
    if (inv.amountReceived >= inv.grandTotal) {
      newStatus = 'paid';
    } else if (inv.amountReceived > 0) {
      newStatus = 'partial';
    }
    await db.collection('invoices').updateOne({ _id: inv._id }, { $set: { status: newStatus } });
    console.log(`Migrated invoice ${inv.invoiceNumber} to ${newStatus}`);
  }

  console.log('Migration complete');
  process.exit(0);
}

migrateSentInvoices().catch(console.error);
