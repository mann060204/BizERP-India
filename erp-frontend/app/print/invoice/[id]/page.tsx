'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { invoicesApi, businessApi } from '../../../../lib/erp-api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper to convert number to words
function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if ((num = num.toString().replace(/[\, ]/g, '') as any) != parseFloat(num as any)) return 'Not a Number';
  let n = parseInt(num as any, 10);
  if (n === 0) return 'Zero';
  
  let str = '';
  if (n > 9999999) {
    str += numberToWords(Math.floor(n / 10000000)) + 'Crore ';
    n %= 10000000;
  }
  if (n > 99999) {
    str += numberToWords(Math.floor(n / 100000)) + 'Lakh ';
    n %= 100000;
  }
  if (n > 999) {
    str += numberToWords(Math.floor(n / 1000)) + 'Thousand ';
    n %= 1000;
  }
  if (n > 99) {
    str += a[Math.floor(n / 100)] + 'Hundred ';
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) str += a[n];
    else {
      str += b[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) str += a[n % 10];
    }
  }
  return str.trim();
}

export default function PrintableInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, busRes] = await Promise.all([
          invoicesApi.get(id as string),
          businessApi.getProfile()
        ]);
        setInvoice(invRes.data.invoice);
        setBusiness(busRes.data.business);
        
        // Auto print after a short delay for rendering
        setTimeout(() => window.print(), 800);
      } catch (e) {
        toast.error('Failed to load invoice for printing');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-white"><Loader2 className="w-12 h-12 animate-spin text-gray-400" /></div>;
  if (!invoice || !business) return <div className="p-10 text-center text-red-500 font-bold bg-white min-h-screen">Invoice not found</div>;

  const template = business.invoiceTemplate || 'A4';
  const isInterState = invoice.isInterState;
  const tAndC = invoice.termsAndConditions || business.termsAndConditions || '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is delayed.';

  if (template === 'POS') {
    return (
      <div className="bg-white min-h-screen text-black print:p-0 p-8 font-sans flex justify-center">
        <div className="w-[80mm] bg-white print:shadow-none shadow-lg print:p-0 p-4 text-[12px] leading-tight font-mono">
          <div className="text-center mb-4">
            {business.logo && <img src={business.logo} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain grayscale" />}
            <h1 className="text-xl font-bold uppercase">{business.businessName || business.name}</h1>
            <p>{business.address?.street}</p>
            <p>{business.address?.city}, {business.address?.state}</p>
            {business.gstin && <p>GSTIN: {business.gstin}</p>}
            <p>Ph: {business.mobile || business.phone}</p>
          </div>
          
          <div className="border-t border-dashed border-black py-2 mb-2">
            <p><strong>Inv No:</strong> {invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Customer:</strong> {invoice.customerSnapshot.name}</p>
            {invoice.customerSnapshot.mobile && <p><strong>Phone:</strong> {invoice.customerSnapshot.mobile}</p>}
          </div>

          <table className="w-full text-left mb-2 border-t border-b border-dashed border-black py-2">
            <thead>
              <tr>
                <th className="py-1">Item</th>
                <th className="py-1 text-right">Qty</th>
                <th className="py-1 text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-1 pr-1">{item.name}</td>
                  <td className="py-1 text-right whitespace-nowrap">{item.quantity} x {item.rate}</td>
                  <td className="py-1 text-right font-bold">{(item.taxableAmount + item.cgst + item.sgst + item.igst).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 mb-4 text-right">
            <p>Subtotal: {invoice.totalTaxableAmount.toFixed(2)}</p>
            {isInterState ? (
              <p>IGST: {invoice.totalIGST.toFixed(2)}</p>
            ) : (
              <>
                <p>CGST: {invoice.totalCGST.toFixed(2)}</p>
                <p>SGST: {invoice.totalSGST.toFixed(2)}</p>
              </>
            )}
            <p className="text-lg font-bold border-t border-dashed border-black pt-1">Total: ₹{invoice.grandTotal.toFixed(2)}</p>
            <p>Paid: {invoice.amountReceived.toFixed(2)}</p>
            <p>Balance: {invoice.balance.toFixed(2)}</p>
          </div>

          <div className="text-center border-t border-dashed border-black pt-4">
            <p className="font-bold">Thank You!</p>
            <p>Visit Again</p>
          </div>

          {/* Non-print controls */}
          <div className="print:hidden mt-8 flex flex-col gap-2 border-t pt-4">
            <button onClick={() => window.print()} className="py-2 bg-blue-600 text-white rounded font-bold">Print</button>
            <button onClick={() => window.close()} className="py-2 bg-gray-200 text-black rounded font-bold">Close</button>
          </div>
        </div>
      </div>
    );
  }

  // A4 Template (Default)
  return (
    <div className="bg-[#525659] min-h-screen text-black print:bg-white print:p-0 p-8 font-sans flex justify-center text-[11px]">
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none p-8 print:p-0 box-border relative flex flex-col">
        
        {/* Container */}
        <div className="border border-black flex-1 flex flex-col">
          
          {/* Top Header Row */}
          <div className="flex justify-between items-center border-b border-black px-2 py-1">
            <span className="w-1/3 text-left">Page No. 1 of 1</span>
            <span className="w-1/3 text-center font-bold text-sm">
              {invoice.totalGST > 0 ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
            </span>
            <span className="w-1/3 text-right">Original Copy</span>
          </div>

          {/* Company Info Box */}
          <div className="relative border-b border-black flex flex-col items-center justify-center p-4 text-center min-h-[100px]">
            {business.logo && (
               <div className="absolute left-4 top-1/2 -translate-y-1/2 w-24 h-24 border border-gray-300 flex items-center justify-center p-1">
                 <img src={business.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
               </div>
            )}
            <h1 className="text-2xl font-bold text-black">{business.businessName || business.name}</h1>
            <p className="mt-1">{business.address?.street}, {business.address?.city}, {business.address?.state} {business.address?.pinCode}</p>
            <p>Mobile: +91 {business.mobile || business.phone} | Email: {business.email}</p>
            <p className="font-bold mt-1">
               {business.gstin ? `GSTIN - ${business.gstin}` : ''} 
               {business.gstin && business.pan ? ' | ' : ''} 
               {business.pan ? `PAN - ${business.pan}` : ''}
            </p>
          </div>

          {/* Billing & Invoice Details */}
          <div className="flex border-b border-black">
            {/* Left Col: Billing Details */}
            <div className="w-[55%] border-r border-black p-2 flex flex-col gap-1">
              <h2 className="font-bold">Billing Details</h2>
              <p><strong>Name:</strong> {invoice.customerSnapshot.name}</p>
              <p>
                {invoice.customerSnapshot.gstin && <span><strong>GSTIN:</strong> {invoice.customerSnapshot.gstin} | </span>}
                <span><strong>Mobile:</strong> {invoice.customerSnapshot.mobile || 'N/A'} | </span>
                <span><strong>Email:</strong> {invoice.customerSnapshot.email || 'N/A'}</span>
              </p>
              <p className="whitespace-pre-wrap">{invoice.customerSnapshot.billingAddress || 'Address not provided'}</p>
            </div>
            {/* Right Col: Invoice Details */}
            <div className="w-[45%] p-2 grid grid-cols-[100px_1fr] gap-y-1 items-start">
              <span className="font-bold">Invoice Number</span>
              <span>: {invoice.invoiceNumber}</span>
              
              <span className="font-bold">Invoice Date</span>
              <span>: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</span>
              
              <span className="font-bold">Due date</span>
              <span>: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : 'N/A'}</span>
              
              <span className="font-bold">Place of Supply</span>
              <span>: {invoice.placeOfSupply || 'N/A'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 flex flex-col">
            <table className="w-full text-center border-collapse h-full">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th className="border-r border-black p-2 w-10">Sr.</th>
                  <th className="border-r border-black p-2 text-left">Item Description</th>
                  <th className="border-r border-black p-2 w-20">HSN/SAC</th>
                  <th className="border-r border-black p-2 w-16">Qty</th>
                  <th className="border-r border-black p-2 w-16">Unit</th>
                  <th className="border-r border-black p-2 w-24 text-right">List Price</th>
                  <th className="border-r border-black p-2 w-16 text-right">Disc. (%)</th>
                  <th className="border-r border-black p-2 w-16 text-right">Tax %</th>
                  <th className="p-2 w-28 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item: any, idx: number) => {
                  const amt = (item.quantity * item.rate).toFixed(2);
                  return (
                    <tr key={idx} className="align-top">
                      <td className="border-r border-black px-2 py-1">{idx + 1}</td>
                      <td className="border-r border-black px-2 py-1 text-left">{item.name}</td>
                      <td className="border-r border-black px-2 py-1">{item.hsnCode || '-'}</td>
                      <td className="border-r border-black px-2 py-1">{item.quantity}</td>
                      <td className="border-r border-black px-2 py-1">{item.unit || 'Nos'}</td>
                      <td className="border-r border-black px-2 py-1 text-right">{item.rate.toFixed(2)}</td>
                      <td className="border-r border-black px-2 py-1 text-right">{item.discount || 0}</td>
                      <td className="border-r border-black px-2 py-1 text-right">{item.gstRate}</td>
                      <td className="px-2 py-1 text-right">{(item.taxableAmount + item.cgst + item.sgst + item.igst).toFixed(2)}</td>
                    </tr>
                  );
                })}
                {/* Filler space */}
                <tr className="flex-1 h-full">
                  <td className="border-r border-black"></td><td className="border-r border-black"></td>
                  <td className="border-r border-black"></td><td className="border-r border-black"></td>
                  <td className="border-r border-black"></td><td className="border-r border-black"></td>
                  <td className="border-r border-black"></td><td className="border-r border-black"></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Subtotals & Totals */}
          <div className="border-t border-black">
             {invoice.totalDiscount > 0 && (
               <div className="flex justify-between border-b border-black px-2 py-1">
                 <span className="ml-[80%] pl-2 text-right">Discount</span>
                 <span className="w-28 text-right">- {invoice.totalDiscount.toFixed(2)}</span>
               </div>
             )}
             {invoice.shippingCharge > 0 && (
               <div className="flex justify-between border-b border-black px-2 py-1">
                 <span className="ml-[80%] pl-2 text-right">Shipping</span>
                 <span className="w-28 text-right">+ {invoice.shippingCharge.toFixed(2)}</span>
               </div>
             )}
             <div className="flex justify-between border-b border-black px-2 py-1 font-bold">
               <span className="text-center flex-1">Total</span>
               <span className="w-28 text-right">{invoice.grandTotal.toFixed(2)}</span>
             </div>
          </div>

          {/* Amount in Words */}
          <div className="border-b border-black p-2">
             <p className="font-bold">Rs. {numberToWords(Math.round(invoice.grandTotal))} Only</p>
             <p className="font-bold text-[10px] mt-1">
                Settled by - {invoice.paymentMode} : {invoice.amountReceived.toFixed(2)} | Invoice Balance : {invoice.balance.toFixed(2)}
             </p>
          </div>

          {/* Footer Blocks */}
          <div className="flex h-48">
            {/* Terms and Conditions */}
            <div className="w-[35%] border-r border-black p-2 flex flex-col">
              <h3 className="font-bold">Terms and Conditions</h3>
              <p className="text-[10px] mb-1">E & O.E</p>
              <div className="text-[10px] font-bold whitespace-pre-wrap leading-tight pr-2 flex-1">
                {tAndC}
              </div>
            </div>
            
            {/* Bank Details */}
            <div className="w-[30%] border-r border-black p-2 flex flex-col justify-center gap-1">
               {business.bankDetails?.accountNumber ? (
                 <>
                   <p className="font-bold">Account Number: {business.bankDetails.accountNumber}</p>
                   <p className="font-bold">Bank: {business.bankDetails.bankName}</p>
                   <p className="font-bold">IFSC: {business.bankDetails.ifsc}</p>
                   <p className="font-bold">Branch: {business.bankDetails.branch}</p>
                   <p className="font-bold">Name: {business.ownerName || business.businessName}</p>
                 </>
               ) : (
                 <div className="text-gray-400 italic text-center w-full">Bank details not provided</div>
               )}
            </div>

            {/* Signature Box */}
            <div className="w-[35%] p-2 flex flex-col justify-between items-end relative">
               <p className="font-bold text-center w-full">For {business.businessName || business.name}</p>
               <p className="font-bold absolute bottom-2 right-2">Signature</p>
            </div>
          </div>

        </div>

        {/* Outer Footer Tag */}
        <div className="text-center text-[10px] mt-1 text-blue-600 print:text-black">
          Invoice Created by <a href="#" className="underline">ERP Software</a>
        </div>

      </div>

      {/* Non-print controls floating */}
      <div className="print:hidden fixed bottom-8 right-8 flex flex-col gap-2">
        <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-2xl hover:bg-blue-700">Print Invoice</button>
        <button onClick={() => window.close()} className="px-6 py-3 bg-white text-black border rounded-full font-bold shadow-2xl hover:bg-gray-100">Close Window</button>
      </div>

    </div>
  );
}
