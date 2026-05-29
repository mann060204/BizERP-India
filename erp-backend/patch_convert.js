const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'controllers', 'quotation.controller.ts');
let content = fs.readFileSync(filepath, 'utf8');

const importInvoice = `import Invoice from '../models/Invoice.model';\n`;
if (!content.includes('import Invoice')) {
  content = importInvoice + content;
}

const convertFunc = `
export const convertToInvoice = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const quotation = await Quotation.findOne({ _id: req.params.id, businessId });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    
    // Auto increment logic for invoice
    const business = await Business.findById(businessId);
    let counter = 1;
    let prefix = 'GST-';
    if (business) {
      if (quotation.quotationType === 'NON-GST') {
        prefix = 'NON-GST-';
        counter = business.nonGstInvoiceCounter || 1;
        business.nonGstInvoiceCounter = counter + 1;
      } else {
        prefix = 'GST-';
        counter = business.invoiceCounter || 1;
        business.invoiceCounter = counter + 1;
      }
      await business.save();
    }
    
    const nextNumber = \`\${prefix}\${new Date().getFullYear()}-\${counter.toString().padStart(4, '0')}\`;
    
    // Prepare invoice data from quotation
    const invoiceData = quotation.toObject();
    delete invoiceData._id;
    delete invoiceData.createdAt;
    delete invoiceData.updatedAt;
    delete invoiceData.__v;
    invoiceData.invoiceNumber = nextNumber;
    invoiceData.invoiceDate = new Date();
    invoiceData.invoiceType = quotation.quotationType;
    invoiceData.status = 'Draft';
    invoiceData.amountReceived = 0;
    invoiceData.balance = invoiceData.grandTotal;
    invoiceData.paymentMode = 'Cash';
    
    const invoice = new Invoice(invoiceData);
    const createdInvoice = await invoice.save();
    
    // Update quotation status
    quotation.status = 'Invoiced';
    await quotation.save();
    
    res.status(201).json(createdInvoice);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
`;

if (!content.includes('convertToInvoice')) {
  content += convertFunc;
  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Quotation controller updated with convertToInvoice');
}

// Add route
const routesPath = path.join(__dirname, 'src', 'routes', 'quotation.routes.ts');
let routes = fs.readFileSync(routesPath, 'utf8');
if (!routes.includes('convertToInvoice')) {
  routes = routes.replace('getNextQuotationNumber', 'getNextQuotationNumber, convertToInvoice');
  routes = routes.replace('router.post(\'/\', createQuotation);', 'router.post(\'/\', createQuotation);\nrouter.post(\'/:id/convert\', convertToInvoice);');
  fs.writeFileSync(routesPath, routes, 'utf8');
  console.log('Quotation routes updated with convertToInvoice');
}
