'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copyType, setCopyType] = useState('Original Copy');
  const [printFormat, setPrintFormat] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isDev = process.env.NODE_ENV !== 'production';
        const fetchUrl = isDev 
          ? `/backend-api/public/invoice/${id}`
          : `https://bizerp-api.vercel.app/api/v1/public/invoice/${id}`;
          
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);

        
        const data = await res.json();
        setInvoice(data.invoice);
        setBusiness(data.business);
        
        // Auto print after a short delay for rendering
        setTimeout(() => window.print(), 800);
      } catch (e: any) {
        console.error('Fetch error:', e);
        toast.error(`Error: ${e.message}`);
        // Inject error message into state so it renders on screen instead of generic div
        setInvoice({ __error: e.message });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-white"><Loader2 className="w-12 h-12 animate-spin text-gray-400" /></div>;
  if (invoice?.__error) return <div className="p-10 text-center text-red-500 font-bold bg-white min-h-screen">Error: {invoice.__error}</div>;
  if (!invoice || !business) return <div className="p-10 text-center text-red-500 font-bold bg-white min-h-screen">Invoice not found</div>;

  
  const handleSharePdf = async () => {
    try {
      const element = document.getElementById('invoice-print-area');
      if (!element) return;
      
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0,
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const file = new File([pdfBlob], `Invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Hello ${invoice.customerSnapshot?.name}, please find attached your invoice.`,
          files: [file]
        });
      } else {
        // Fallback to download if Web Share API not supported for files
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded. Please attach it to your email/message manually.', { duration: 5000 });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to share PDF');
    }
  };

  const template = printFormat || business.invoiceTemplate || 'A4';
  const isInterState = invoice.isInterState;
  const isNonGst = invoice.invoiceType === 'NON-GST';
  const tAndC = invoice.termsAndConditions || business.termsAndConditions || '1. Any complaint regarding goods should be made within 24 hrs from the Receipt.\n2. Interest will be charged @ 18% p.a. on invoice amount including GST amount.\n3. Goods once sold will not be taken back.';

  if (template === 'POS') {
    return (
      <>
      <div className="print:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white p-3 flex justify-between items-center z-50 shadow-md">
        <span className="text-sm font-medium">Invoice {invoice.invoiceNumber}</span>
        
        <div className="flex gap-2 items-center">
          <select value={copyType} onChange={e => setCopyType(e.target.value)} className="text-xs bg-slate-700 border-none rounded px-2 py-1 text-white outline-none">
            <option value="Original Copy">Original Copy</option>
                  <option value="Duplicate Copy">Duplicate Copy</option>
                  <option value="1st Copy">1st Copy</option>
                  <option value="2nd Copy">2nd Copy</option>
                  <option value="Extra Copy">Extra Copy</option>
                </select>
          <select value={printFormat || ''} onChange={e => setPrintFormat(e.target.value)} className="text-xs bg-slate-700 border-none rounded px-2 py-1 text-white outline-none">
            <option value="">Default Format</option>
            <option value="A4">A4</option>
            <option value="POS">Thermal Receipt (POS)</option>
          </select>
          <button onClick={() => window.print()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow transition">Print</button>
     
        </div>
  
      </div>
      <div className="bg-white min-h-screen text-black print:p-0 p-8 pt-20 font-sans flex justify-center">
        <div id="invoice-print-area" className="w-[80mm] bg-white print:shadow-none shadow-lg print:p-0 p-4 text-[12px] leading-tight font-mono">
          <div className="text-center mb-4">
            {business.logo && <img src={business.logo} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain grayscale" />}
            <h1 className="text-xl font-bold uppercase">{business.businessName || business.name}</h1>
            <p>{business.address?.street}</p>
            <p>{business.address?.city}, {business.address?.state} {business.gstin?.length >= 2 && `(${business.gstin.substring(0, 2)})`}</p>
            {business.gstin && <p>GSTIN: {business.gstin}</p>}
            <p>Ph: {business.mobile || business.phone}</p>
          </div>
          
          <div className="border-t border-dashed border-black py-2 mb-2">
            <p className="text-center font-bold pb-1">{copyType}</p>
            <p><strong>Inv No:</strong> {invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Payment:</strong> {invoice.paymentMode}</p>
            {invoice.txnId && <p><strong>Txn ID:</strong> {invoice.txnId}</p>}
            {invoice.deliveryRemarks && <p><strong>Delivery Note:</strong> {invoice.deliveryRemarks}</p>}
            {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
              <div className="mt-1 border-t border-dashed border-gray-300 pt-1">
                <strong>Payment Hist:</strong>
                {invoice.paymentHistory.map((p: any, i: number) => (
                   <p key={i} className="pl-2">- {new Date(p.date).toLocaleDateString('en-GB')}: {p.mode}{p.bankId && p.bankId.bankName ? ` (${p.bankId.bankName})` : ''} ₹{p.amount}</p>
                ))}
              </div>
            )}
            <p><strong>Customer:</strong> {invoice.customerSnapshot.name}</p>
            {invoice.customerSnapshot.mobile && <p><strong>Phone:</strong> {invoice.customerSnapshot.mobile}</p>}
          </div>

          <div className="overflow-x-auto w-full">
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
                  <td className="py-1 pr-1">
                    <span className="font-bold">{item.productName}</span>
                    {item.description && <span className="block text-[10px] text-gray-700">{item.description}</span>}
                  </td>
                  <td className="py-1 text-right whitespace-nowrap">{item.quantity} x {item.rate}</td>
                  <td className="py-1 text-right font-bold">{(item.taxableAmount + item.cgst + item.sgst + item.igst).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

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
            <button onClick={() => window.print()} className="py-2 bg-action-500 text-white rounded font-bold">Print</button>
            <button onClick={() => window.close()} className="py-2 bg-gray-200 text-black rounded font-bold">Close</button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // A4 Template (Matches specific photo layout)
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .a4-page { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 10mm !important; }
        }
      `}} />
      <div className="print:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white p-3 flex justify-between items-center z-50 shadow-md">
        <span className="text-sm font-medium">Invoice {invoice.invoiceNumber}</span>
        
        <div className="flex gap-2 items-center">
          <select value={copyType} onChange={e => setCopyType(e.target.value)} className="text-xs bg-slate-700 border-none rounded px-2 py-1 text-white outline-none">
            <option value="Original Copy">Original Copy</option>
                  <option value="Duplicate Copy">Duplicate Copy</option>
                  <option value="1st Copy">1st Copy</option>
                  <option value="2nd Copy">2nd Copy</option>
                  <option value="Extra Copy">Extra Copy</option>
                </select>
          <select value={printFormat || ''} onChange={e => setPrintFormat(e.target.value)} className="text-xs bg-slate-700 border-none rounded px-2 py-1 text-white outline-none">
            <option value="">Default Format</option>
            <option value="A4">A4</option>
            <option value="POS">Thermal Receipt (POS)</option>
          </select>
          <button onClick={() => window.print()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow transition">Print</button>
     
        </div>
  
      </div>
      <div className="bg-[#525659] min-h-screen text-black print:bg-white print:p-0 p-8 pt-20 font-sans flex justify-center text-[11px]">
        <div id="invoice-print-area" className="a4-page w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none p-8 print:p-0 box-border relative flex flex-col overflow-hidden">
        
        {/* Container */}
        <div className="border-2 border-gray-800 flex-1 flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 p-2">
            <div className="flex items-center gap-4">
              {business.logo && <img src={business.logo} className="w-20 h-20 object-contain" alt="Logo" />}
              <div>
                <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">{business.businessName || business.name}</h1>
                <p className="text-gray-700">{business.address?.street?.toUpperCase()}</p>
                <p className="text-gray-700">{business.address?.city?.toUpperCase()}, {business.address?.state?.toUpperCase()} {business.gstin?.length >= 2 && `(${business.gstin.substring(0, 2)})`} {business.address?.pinCode}</p>
                <p className="text-gray-700 font-semibold mt-1">Ph: {business.mobile || business.phone}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <h2 className="text-2xl font-black uppercase tracking-widest text-gray-800 border-b-2 border-gray-800 pb-1 mb-2">{isNonGst ? 'RETAIL INVOICE' : 'TAX INVOICE'}</h2>
              <p className="text-[10px] font-semibold">{copyType}</p>
              <p className="text-[11px] font-bold mt-1 text-gray-700">GSTIN: {business.gstin}</p>
              {business.pan && <p className="text-[11px] font-bold text-gray-700">PAN: {business.pan}</p>}
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 border-b-2 border-gray-800 text-[10px]">
            {/* Bill To */}
            <div className="border-r-2 border-gray-800 p-2 flex flex-col">
              <div className="font-bold text-blue-900 mb-1 border-b border-gray-300 pb-1">Billed To (Customer Detail)</div>
              <div className="grid grid-cols-[60px_1fr] gap-x-1 font-semibold text-gray-800">
                <span>Name</span><span>: {invoice.customerSnapshot.name?.toUpperCase()}</span>
                <span>Address</span><span className="whitespace-pre-wrap leading-tight">: {invoice.customerSnapshot.address?.toUpperCase() || 'N/A'}</span>
                {invoice.shippingAddress && (
                  <>
                    <span>Shipped To</span><span className="whitespace-pre-wrap leading-tight">: {invoice.shippingAddress.toUpperCase()}</span>
                  </>
                )}
                <span>Contact</span><span>: {invoice.customerSnapshot.mobile || invoice.contactNo || 'N/A'}</span>
                {isNonGst ? null : (
                  <>
                    <span>GSTIN</span><span>: {invoice.customerSnapshot.gstin || 'N/A'}</span>
                  </>
                )}
                <span>State</span><span>: {invoice.placeOfSupply?.toUpperCase() || 'N/A'} {invoice.customerSnapshot.gstin && invoice.customerSnapshot.gstin.length >= 2 ? `(${invoice.customerSnapshot.gstin.substring(0, 2)})` : ''}</span>
              </div>
            </div>
            {/* Invoice Meta */}
            <div className="p-2 flex flex-col">
              <div className="font-bold text-blue-900 mb-1 border-b border-gray-300 pb-1">Invoice Details</div>
              <div className="grid grid-cols-[100px_1fr] gap-x-1 font-semibold text-gray-800">
                <span>Invoice No.</span><span>: {invoice.invoiceNumber}</span>
                <span>Invoice Date</span><span>: {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</span>
                <span>Payment Mode</span><span className="whitespace-pre-wrap leading-tight">: {invoice.paymentMode}</span>
                <span>Reverse Charge</span><span>: {invoice.isReverseCharge ? 'YES' : 'NO'}</span>
                <span>Transport</span><span>: {invoice.deliveryTerms || 'N/A'}</span>
                {invoice.txnId && <><span>Transaction ID</span><span className="whitespace-pre-wrap leading-tight">: {invoice.txnId}</span></>}
                {invoice.deliveryRemarks && <><span>Delivery Note</span><span className="whitespace-pre-wrap leading-tight">: {invoice.deliveryRemarks}</span></>}
                {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
                  <>
                    <span className="self-start pt-1">Payment Hist.</span>
                    <span className="whitespace-pre-wrap leading-tight pt-1 border-t border-gray-100 mt-1">
                      : {invoice.paymentHistory.map((p: any) => `${new Date(p.date).toLocaleDateString('en-GB')} - ${p.mode}${p.bankId && p.bankId.bankName ? ` (${p.bankId.bankName})` : ''} - ₹${p.amount}`).join('\n  ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 border-b-2 border-gray-800">
            <table className="w-full h-full text-center border-collapse text-[10px] table-fixed font-semibold text-gray-800">
              <thead>
                <tr className="border-b-2 border-gray-800 bg-action-50 text-blue-900">
                  <th className="border-r-2 border-gray-800 p-1 w-[4%]">Sr</th>
                  <th className={`border-r-2 border-gray-800 p-1 text-left ${isNonGst ? 'w-[60%]' : 'w-[32%]'}`}>Product / Service Description</th>
                  {!isNonGst && <th className="border-r-2 border-gray-800 p-1 w-[10%]">HSN/SAC</th>}
                  <th className={`border-r-2 border-gray-800 p-1 ${isNonGst ? 'w-[12%]' : 'w-[8%]'}`}>Qty</th>
                  <th className={`border-r-2 border-gray-800 p-1 ${isNonGst ? 'w-[12%]' : 'w-[10%]'}`}>Rate</th>
                  {!isNonGst && <th className="border-r-2 border-gray-800 p-1 w-[12%]">Taxable</th>}
                  {!isNonGst && (
                    <th className="border-r-2 border-gray-800 p-0 w-[12%]">
                      <div className="border-b-2 border-gray-800 pb-[1px]">GST</div>
                      <div className="flex"><span className="w-1/2 border-r-2 border-gray-800">%</span><span className="w-1/2">Amt</span></div>
                    </th>
                  )}
                  <th className="p-1 w-[12%]">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item: any, idx: number) => {
                  const taxAmt = item.cgst + item.sgst + item.igst;
                  const totalAmt = item.taxableAmount + taxAmt;
                  return (
                    <tr key={idx} className="align-top border-b border-gray-200">
                      <td className="border-r-2 border-gray-800 px-1 py-1">{idx + 1}</td>
                      <td className="border-r-2 border-gray-800 px-1 py-1 text-left">
                        <span className="font-bold text-gray-900">{item.productName?.toUpperCase()}</span>
                        {item.description && <span className="block text-[8px] text-gray-500">{item.description.toUpperCase()}</span>}
                      </td>
                      {!isNonGst && <td className="border-r-2 border-gray-800 px-1 py-1">{item.hsnCode || '-'}</td>}
                      <td className="border-r-2 border-gray-800 px-1 py-1">{item.quantity} {item.unit}</td>
                      <td className="border-r-2 border-gray-800 px-1 py-1 text-right">{item.rate.toFixed(2)}</td>
                      {!isNonGst && <td className="border-r-2 border-gray-800 px-1 py-1 text-right">{item.taxableAmount.toFixed(2)}</td>}
                      {!isNonGst && (
                        <td className="border-r-2 border-gray-800 p-0">
                           <div className="flex h-full min-h-[24px]">
                             <span className="w-1/2 border-r-2 border-gray-800 pt-[2px]">{item.gstRate}%</span>
                             <span className="w-1/2 pt-[2px] text-right pr-1">{taxAmt.toFixed(2)}</span>
                           </div>
                        </td>
                      )}
                      <td className="px-1 py-1 text-right">{isNonGst ? (item.quantity * item.rate).toFixed(2) : totalAmt.toFixed(2)}</td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="border-t-2 border-b-2 border-gray-800 bg-action-50 h-6 font-bold text-blue-900">
                  <td className="border-r-2 border-gray-800"></td>
                  <td className="border-r-2 border-gray-800 text-right pr-2">Sub-Total:</td>
                  {!isNonGst && <td className="border-r-2 border-gray-800"></td>}
                  <td className="border-r-2 border-gray-800">{invoice.lineItems.reduce((s:any, i:any)=>s + i.quantity, 0)}</td>
                  <td className="border-r-2 border-gray-800"></td>
                  {!isNonGst && <td className="border-r-2 border-gray-800 text-right pr-1">{invoice.totalTaxableAmount.toFixed(2)}</td>}
                  {!isNonGst && (
                    <td className="border-r-2 border-gray-800 p-0">
                       <div className="flex h-full">
                         <span className="w-1/2 border-r-2 border-gray-800"></span>
                         <span className="w-1/2 text-right pr-1 pt-[2px]">{invoice.totalGST.toFixed(2)}</span>
                       </div>
                    </td>
                  )}
                  <td className="text-right pr-1">{isNonGst ? invoice.subtotal.toFixed(2) : (invoice.totalTaxableAmount + invoice.totalGST).toFixed(2)}</td>
                </tr>
                {/* Filler space */}
                <tr className="h-full">
                  <td className="border-r-2 border-gray-800"></td><td className="border-r-2 border-gray-800"></td>
                  {!isNonGst && <td className="border-r-2 border-gray-800"></td>}
                  <td className="border-r-2 border-gray-800"></td><td className="border-r-2 border-gray-800"></td>
                  {!isNonGst && <td className="border-r-2 border-gray-800"></td>}
                  {!isNonGst && <td className="border-r-2 border-gray-800 p-0"><div className="flex h-full"><span className="w-1/2 border-r-2 border-gray-800"></span><span className="w-1/2"></span></div></td>}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex border-t-2 border-gray-800 text-[10px] font-bold min-h-[14rem] bg-white">
            {/* Left Side (Bank, Amount in Words, T&C) */}
            <div className="w-[65%] flex flex-col border-r-2 border-gray-800">
               <div className="border-b-2 border-gray-800 px-2 py-1 flex justify-between bg-action-50 text-blue-900">
                 <span>Invoice Total in Words:</span>
                 <span className="italic uppercase">Rupees {numberToWords(Math.round(invoice.grandTotal))} Only</span>
               </div>
               
               <div className="flex border-b-2 border-gray-800 flex-1 relative">
                 <div className="w-[70%] p-2 border-r-2 border-gray-800 flex flex-col justify-center">
                   <p className="mb-1 text-blue-900 border-b border-gray-300 pb-1 uppercase">Our Bank Details</p>
                   <div className="grid grid-cols-[80px_1fr] gap-x-1 leading-tight text-[10px] text-gray-800">
                     <span>Bank Name</span><span>: {business.bankDetails?.bankName || 'N/A'}</span>
                     <span>A/C Number</span><span>: {business.bankDetails?.accountNumber || 'N/A'}</span>
                     <span>IFSC Code</span><span>: {business.bankDetails?.ifsc || 'N/A'}</span>
                     <span>Branch</span><span>: {business.bankDetails?.branch || 'N/A'}</span>
                     <span>UPI ID</span><span>: {business.bankDetails?.upiId || 'N/A'}</span>
                   </div>
                 </div>
                 <div className="w-[30%] p-1 flex flex-col justify-center items-center">
                    {business.bankDetails?.upiId && (
                       <>
                         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`upi://pay?pa=${business.bankDetails.upiId}&pn=${business.ownerName || business.businessName}&am=${invoice.grandTotal.toFixed(2)}&cu=INR`)}`} alt="UPI QR" className="w-[80px] h-[80px]" />
                         <span className="text-[9px] mt-1 text-blue-900 font-bold">Pay using UPI</span>
                       </>
                    )}
                 </div>
               </div>
               
               <div className="p-2 text-[8.5px] text-gray-700 relative">
                  <p className="font-bold text-[10px] mb-1 text-blue-900 uppercase">Terms & Conditions / Declaration:</p>
                  <div className="whitespace-pre-wrap leading-tight">{tAndC}</div>
               </div>
            </div>
            
            {/* Right Side (Summary Totals) */}
            <div className="w-[35%] flex flex-col font-bold text-gray-800">
               <div className="flex justify-between border-b-2 border-gray-800 px-2 py-1 bg-action-50 text-blue-900">
                 <span>SUMMARY</span><span>AMOUNT</span>
               </div>
               <div className="flex justify-between border-b border-gray-300 px-2 py-1">
                 <span>{isNonGst ? 'Subtotal :' : 'Taxable Amount :'}</span><span>{isNonGst ? invoice.subtotal.toFixed(2) : invoice.totalTaxableAmount.toFixed(2)}</span>
               </div>
               {!isNonGst && (
                 <>
                   {isInterState ? (
                     <div className="flex justify-between border-b border-gray-300 px-2 py-1">
                       <span>IGST Amt :</span><span>{invoice.totalIGST.toFixed(2)}</span>
                     </div>
                   ) : (
                     <>
                       <div className="flex justify-between border-b border-gray-300 px-2 py-1">
                         <span>CGST Amt :</span><span>{invoice.totalCGST.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between border-b border-gray-300 px-2 py-1">
                         <span>SGST Amt :</span><span>{invoice.totalSGST.toFixed(2)}</span>
                       </div>
                     </>
                   )}
                 </>
               )}
               <div className="flex justify-between border-b border-gray-300 px-2 py-1">
                 <span>Discount :</span><span className="text-red-600">-{invoice.totalDiscount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-gray-300 px-2 py-1">
                 <span>Shipping / Freight :</span><span>{invoice.shippingCharge.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b-2 border-gray-800 px-2 py-1">
                 <span>Round off :</span><span>{(invoice.grandTotal - (invoice.totalTaxableAmount + invoice.totalGST + invoice.shippingCharge - invoice.totalDiscount)).toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b-2 border-gray-800 px-2 py-1.5 bg-action-100 text-[13px] text-blue-900">
                 <span>Total Amount :</span><span>{invoice.grandTotal.toFixed(2)}</span>
               </div>
               
               <div className="p-2 flex-1 flex flex-col justify-end items-center text-center">
                 <p className="font-bold text-[10px] text-blue-900 uppercase">For, {business.businessName || business.name}</p>
                 <p className="text-[10px] mt-10 text-gray-500">Authorised Signatory</p>
               </div>
            </div>
          </div>

        </div>
        
        {/* Bottom Tagline */}
        <div className="text-center text-[10px] mt-1 text-gray-500 font-semibold print:text-gray-800">
          Thank You For Business With Us! | This is a computer generated invoice.
        </div>

      </div>

      {/* Non-print controls floating */}
      
    </div>
    </>
  );
}
