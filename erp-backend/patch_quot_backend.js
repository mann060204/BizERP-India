const fs = require('fs');
const path = require('path');

function patchQuotationBackend() {
  const modelPath = path.join(__dirname, 'src', 'models', 'Quotation.model.ts');
  let modelContent = fs.readFileSync(modelPath, 'utf8');
  modelContent = modelContent.replace(
    /enum: \['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'\],/g,
    "enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Invoiced', 'Cancelled'],"
  );
  modelContent = modelContent.replace(
    /default: 'draft'/g,
    "default: 'Draft'"
  );
  fs.writeFileSync(modelPath, modelContent, 'utf8');

  const ctrlPath = path.join(__dirname, 'src', 'controllers', 'quotation.controller.ts');
  let ctrlContent = fs.readFileSync(ctrlPath, 'utf8');
  ctrlContent = ctrlContent.replace(/createdBy: \(req as any\)\.user\._id/g, "createdBy: req.user!.userId");
  
  // also default status to Draft if they send unpaid or draft
  ctrlContent = ctrlContent.replace(
    /const quotation = new Quotation\(\{ \.\.\.data, businessId, createdBy: req\.user!\.userId \}\);/,
    "if (!['Draft', 'Sent', 'Accepted', 'Rejected', 'Invoiced', 'Cancelled'].includes(data.status)) data.status = 'Draft';\n      const quotation = new Quotation({ ...data, businessId, createdBy: req.user!.userId });"
  );

  fs.writeFileSync(ctrlPath, ctrlContent, 'utf8');
}

patchQuotationBackend();
console.log('Quotation backend patched');
