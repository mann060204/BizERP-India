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
  isInterState: boolean
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
    const taxableAmount = gross - discountAmt;

    let cgst = 0, sgst = 0, igst = 0;
    if (isInterState) {
      igst = (taxableAmount * gstRate) / 100;
    } else {
      cgst = (taxableAmount * gstRate) / 2 / 100;
      sgst = (taxableAmount * gstRate) / 2 / 100;
    }

    const totalAmount = taxableAmount + cgst + sgst + igst;

    subtotal += gross;
    totalDiscount += discountAmt;
    totalTaxableAmount += taxableAmount;
    totalCGST += cgst;
    totalSGST += sgst;
    totalIGST += igst;

    return {
      ...item,
      unit: item.unit || 'Nos',
      discount: discountPct,
      taxableAmount: round2(taxableAmount),
      cgst: round2(cgst),
      sgst: round2(sgst),
      igst: round2(igst),
      totalAmount: round2(totalAmount),
    };
  });

  const totalGST = totalCGST + totalSGST + totalIGST;
  const grandTotal = totalTaxableAmount + totalGST;

  return {
    lineItems,
    subtotal: round2(subtotal),
    totalDiscount: round2(totalDiscount),
    totalTaxableAmount: round2(totalTaxableAmount),
    totalCGST: round2(totalCGST),
    totalSGST: round2(totalSGST),
    totalIGST: round2(totalIGST),
    totalGST: round2(totalGST),
    grandTotal: round2(grandTotal),
  };
};

const round2 = (n: number) => Math.round(n * 100) / 100;
