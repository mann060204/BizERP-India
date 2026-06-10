interface LineItemInput {
  productName: string;
  productId?: any;
  hsnCode?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discount?: number;
  gstRate: number;
}

interface CalculatedLineItem extends LineItemInput {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  unit: string;
}

interface InvoiceTotals {
  lineItems: CalculatedLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  grandTotal: number;
}

/**
 * Computes GST for each line item and returns invoice totals.
 * CGST + SGST for intra-state, IGST for inter-state.
 */
export const calculateInvoiceTotals = (
  items: LineItemInput[],
  isInterState: boolean,
  isNonGst: boolean = false,
  shippingCharge: number = 0,
  shippingGstRate: number = 0
): InvoiceTotals => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxableAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const lineItems: CalculatedLineItem[] = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discountPct = Number(item.discount) || 0;
    const gstRate = Number(item.gstRate) || 0;

    const gross = qty * rate;
    const discountAmt = (gross * discountPct) / 100;
    // Round taxable amount per item — matches frontend calculateItem()
    const taxableAmount = round3(gross - discountAmt);

    let cgst = 0, sgst = 0, igst = 0;
    if (isNonGst) {
      cgst = 0;
      sgst = 0;
      igst = 0;
    } else if (isInterState) {
      igst = round3((taxableAmount * gstRate) / 100);
    } else {
      cgst = round3((taxableAmount * gstRate) / 2 / 100);
      sgst = round3((taxableAmount * gstRate) / 2 / 100);
    }

    const totalAmount = round3(taxableAmount + cgst + sgst + igst);

    subtotal += gross;
    totalDiscount += round3(discountAmt);
    // Accumulate already-rounded values — keeps backend in sync with frontend
    totalTaxableAmount += taxableAmount;
    totalCGST += cgst;
    totalSGST += sgst;
    totalIGST += igst;

    return {
      ...item,
      unit: item.unit || 'Nos',
      discount: discountPct,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalAmount,
    };
  });

  let shippingCGST = 0;
  let shippingSGST = 0;
  let shippingIGST = 0;

  if (shippingCharge > 0 && shippingGstRate > 0 && !isNonGst) {
    if (isInterState) {
      shippingIGST = (shippingCharge * shippingGstRate) / 100;
    } else {
      shippingCGST = (shippingCharge * shippingGstRate) / 2 / 100;
      shippingSGST = (shippingCharge * shippingGstRate) / 2 / 100;
    }
  }

  totalCGST += shippingCGST;
  totalSGST += shippingSGST;
  totalIGST += shippingIGST;

  const totalGST = totalCGST + totalSGST + totalIGST;
  const grandTotal = totalTaxableAmount + totalGST + shippingCharge;

  return {
    lineItems,
    subtotal: round3(subtotal),
    totalDiscount: round3(totalDiscount),
    totalTaxableAmount: round3(totalTaxableAmount),
    totalCGST: round3(totalCGST),
    totalSGST: round3(totalSGST),
    totalIGST: round3(totalIGST),
    totalGST: round3(totalGST),
    grandTotal: round3(grandTotal),
  };
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;
