const mongoose = require('mongoose');

const test = async () => {
  const QuotationSchema = new mongoose.Schema({
    lineItems: [{
      productName: { type: String, required: true },
    }],
  });

  const InvoiceSchema = new mongoose.Schema({
    lineItems: [{
      productName: { type: String, required: true },
    }],
  }, { strict: true });
  
  // Set _id: false on the sub-schema for Invoice
  InvoiceSchema.path('lineItems').schema.set('_id', false);

  const Quotation = mongoose.model('QuotationTest2', QuotationSchema);
  const Invoice = mongoose.model('InvoiceTest2', InvoiceSchema);

  const q = new Quotation({
    lineItems: [{ productName: 'Item 1' }],
  });

  const invoiceData = q.toObject();
  
  try {
    const i = new Invoice(invoiceData);
    const err = i.validateSync();
    if (err) throw err;
    console.log('Success!', i.toObject());
  } catch (err) {
    console.error('Validation Error:', err.message);
  }
};

test();
