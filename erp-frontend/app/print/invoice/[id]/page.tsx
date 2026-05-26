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
  const tAndC = invoice.termsAndConditions || business.termsAndConditions || '1. Any complaint regarding goods should be made within 24 hrs from the Receipt.\n2. Interest will be charged @ 18% p.a. on invoice amount including GST amount.\n3. Goods once sold will not be taken back.';

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

  // A4 Template (Matches specific photo layout)
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      <div className="bg-[#525659] min-h-screen text-black print:bg-white print:p-0 p-8 font-sans flex justify-center text-[11px]">
        <div className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none p-8 print:p-0 box-border relative flex flex-col overflow-hidden">
        
        {/* Container */}
        <div className="border border-black flex-1 flex flex-col">
          
          {/* Top Header Row */}
          <div className="text-center border-b border-black py-1 font-bold tracking-widest text-[10px]">
            || SHREE GANESHAY NAMAH : ||
          </div>
          <div className="text-center border-b border-black py-2 relative flex flex-col justify-center min-h-[90px]">
             {business.logo && (
               <img src={business.logo} className="absolute right-4 top-2 max-w-[120px] max-h-[70px] object-contain" alt="logo" />
             )}
             <h1 className="text-2xl font-black">{business.businessName || business.name}</h1>
             <p className="font-bold text-[9px] mt-1">{business.address?.street?.toUpperCase()} {business.address?.city?.toUpperCase()} {business.address?.state?.toUpperCase()} {business.address?.pinCode}</p>
             <p className="font-bold text-[9px]">PHONE : (WHATSAPP){business.mobile || business.phone} MOBILE : {business.phone || business.mobile}</p>
             <p className="font-bold text-[10px] mt-1">GSTIN : {business.gstin}</p>
          </div>
          
          <div className="flex border-b border-black text-[9px]">
             <div className="w-[75%] border-r border-black flex items-center justify-center font-bold text-lg tracking-widest bg-gray-100">
                TAX INVOICE
             </div>
             <div className="w-[25%] flex flex-col justify-center pl-1 font-bold leading-tight">
                <p>Original for Recipient</p>
                <div className="border-t border-black my-0.5"></div>
                <p>Duplicate for Supplier/Transporter</p>
                <div className="border-t border-black my-0.5"></div>
                <p>Triplicate for Supplier</p>
             </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black text-[10px] font-bold">
             <div className="border-r border-black grid grid-cols-[1fr_25%]">
                 <div className="border-r border-black p-1 flex flex-col justify-between">
                    <p>Reverse Charge : {invoice.isReverseCharge ? 'YES' : 'NO'}</p>
                    <p>Invoice No : {invoice.invoiceNumber}</p>
                    <p>Invoice Date : {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</p>
                    <div className="flex justify-between items-center pr-2 mt-1">
                       <span>State : {business.address?.state?.toUpperCase() || 'GUJARAT'}</span>
                       <div className="flex items-center">
                         <span className="border border-black px-1 text-[8px] py-[1px]">State Code</span>
                         <span className="border border-black px-1 text-[8px] border-l-0 py-[1px]">{business.address?.state ? '24' : '24'}</span>
                       </div>
                    </div>
                 </div>
                 <div className="p-1">
                    <p>E-Way Bill No : </p>
                 </div>
             </div>
             <div className="grid grid-cols-[1fr_25%]">
                 <div className="border-r border-black p-1 flex flex-col justify-between">
                    <p>Transport : {invoice.deliveryTerms || 'S.M.COURIER SURFACE'}</p>
                    <p>L.R. No : </p>
                    <p>L.R. Date : {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</p>
                    <p className="mt-1">Place Of Supply : {invoice.placeOfSupply?.toUpperCase() || 'SURAT'}</p>
                 </div>
                 <div className="p-1">
                    <p>Parcel : 1</p>
                 </div>
             </div>
          </div>

          <div className="flex border-b border-black text-[10px]">
             <div className="w-1/2 border-r border-black flex flex-col">
                 <div className="border-b border-black px-1 font-bold bg-gray-100">Details of Receiver (Billed to)</div>
                 <div className="p-1 grid grid-cols-[50px_1fr] gap-x-1 font-bold h-full">
                    <span>Name</span><span>: {invoice.customerSnapshot.name?.toUpperCase()}</span>
                    <span>Address</span><span className="whitespace-pre-wrap leading-tight">: {invoice.customerSnapshot.address?.toUpperCase() || ''}</span>
                    <span>Mobile</span><span>: {invoice.customerSnapshot.mobile || invoice.contactNo || ''}</span>
                    <span className="mt-auto">GSTIN</span><span className="mt-auto">: {invoice.customerSnapshot.gstin || ''}</span>
                    <span className="mt-1">State</span>
                    <div className="flex justify-between items-center pr-2 mt-1">
                      <span>: {invoice.placeOfSupply?.toUpperCase() || 'GUJARAT'}</span>
                      <div className="flex items-center">
                        <span className="border border-black px-1 text-[8px] py-[1px]">State Code</span>
                        <span className="border border-black px-1 text-[8px] border-l-0 py-[1px]">24</span>
                      </div>
                    </div>
                 </div>
             </div>
             <div className="w-1/2 flex flex-col">
                 <div className="border-b border-black px-1 font-bold bg-gray-100">Details of Consignee (Shipped to)</div>
                 <div className="p-1 grid grid-cols-[50px_1fr] gap-x-1 font-bold h-full">
                    <span>Name</span><span>: {invoice.customerSnapshot.name?.toUpperCase()}</span>
                    <span>Address</span><span className="whitespace-pre-wrap leading-tight">: {invoice.customerSnapshot.address?.toUpperCase() || ''}</span>
                    <span>Agent</span><span>: {invoice.soldBy?.toUpperCase() || ''}</span>
                    <span className="mt-auto">State</span>
                    <div className="flex justify-between items-center pr-2 mt-auto">
                      <span>: {invoice.placeOfSupply?.toUpperCase() || 'GUJARAT'}</span>
                      <div className="flex items-center">
                        <span className="border border-black px-1 text-[8px] py-[1px]">State Code</span>
                        <span className="border border-black px-1 text-[8px] border-l-0 py-[1px]">24</span>
                      </div>
                    </div>
                 </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col h-[200px] overflow-hidden">
            <table className="w-full text-center border-collapse h-full text-[10px] font-bold table-fixed">
              <thead>
                <tr className="border-b border-black bg-gray-100">
                  <th className="border-r border-black p-1 w-[4%]">SR<br/>No</th>
                  <th className="border-r border-black p-1 w-[40%] text-left">Description of Goods</th>
                  <th className="border-r border-black p-1 w-[12%]">HSN<br/>Code<br/>(GST)</th>
                  <th className="border-r border-black p-1 w-[8%]">Pcs</th>
                  <th className="border-r border-black p-1 w-[8%]">Weight</th>
                  <th className="border-r border-black p-1 w-[8%]">Meters</th>
                  <th className="border-r border-black p-1 w-[4%]">U<br/>O<br/>M</th>
                  <th className="border-r border-black p-1 w-[10%]">Rate</th>
                  <th className="p-1 w-[16%]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item: any, idx: number) => {
                  const amt = item.rate * item.quantity;
                  return (
                    <tr key={idx} className="align-top">
                      <td className="border-r border-black px-1 py-1">{idx + 1}</td>
                      <td className="border-r border-black px-1 py-1 text-left">
                        {item.productName?.toUpperCase()}
                        {item.description && <span className="block text-[8px] text-gray-700">{item.description.toUpperCase()}</span>}
                      </td>
                      <td className="border-r border-black px-1 py-1">{item.hsnCode || '-'}</td>
                      <td className="border-r border-black px-1 py-1">{item.unit === 'Nos' || item.unit === 'Pcs' ? item.quantity : '-'}</td>
                      <td className="border-r border-black px-1 py-1">{item.unit === 'Kgs' ? item.quantity.toFixed(2) : '0.00'}</td>
                      <td className="border-r border-black px-1 py-1">{item.unit === 'Mtr' ? item.quantity.toFixed(2) : '0.00'}</td>
                      <td className="border-r border-black px-1 py-1">{item.unit?.[0]?.toUpperCase()}</td>
                      <td className="border-r border-black px-1 py-1 text-right">{item.rate.toFixed(2)}</td>
                      <td className="px-1 py-1 text-right">{amt.toFixed(2)}</td>
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
                {/* Total Row */}
                <tr className="border-t border-black bg-gray-50 h-6">
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black text-right pr-2">Total :</td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black">{invoice.lineItems.reduce((s:any, i:any)=>s + (i.unit==='Nos'||i.unit==='Pcs'?i.quantity:0), 0) || '-'}</td>
                  <td className="border-r border-black">{invoice.lineItems.reduce((s:any, i:any)=>s + (i.unit==='Kgs'?i.quantity:0), 0).toFixed(2)}</td>
                  <td className="border-r border-black">{invoice.lineItems.reduce((s:any, i:any)=>s + (i.unit==='Mtr'?i.quantity:0), 0).toFixed(2)}</td>
                  <td className="border-r border-black"></td><td className="border-r border-black"></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex border-t border-black text-[10px] font-bold h-48">
            <div className="w-[65%] flex flex-col border-r border-black">
               <div className="border-b border-black px-1 pb-4">
                 Remarks <span className="block italic text-[8px] mt-1">{invoice.remarks}</span>
               </div>
               <div className="border-b border-black px-1 py-0.5 bg-gray-50">
                 Total Invoice Amount in Words :
               </div>
               <div className="border-b border-black px-1 py-1 italic">
                 Rs. {numberToWords(Math.round(invoice.grandTotal))} Only
               </div>
               <div className="flex border-b border-black flex-1 relative">
                 <div className="w-1/2 p-1 border-r border-black flex flex-col gap-0.5">
                   <p className="underline mb-1 text-center font-bold">Bank Details</p>
                   <div className="grid grid-cols-[80px_1fr] gap-x-1 leading-tight text-[9px]">
                     <span>Bank Name</span><span>: {business.bankDetails?.bankName}</span>
                     <span>Bank Account Number</span><span>: {business.bankDetails?.accountNumber}</span>
                     <span>Bank Account IFSC</span><span>: {business.bankDetails?.ifsc}</span>
                   </div>
                 </div>
                 <div className="w-1/2 p-1 relative flex flex-col justify-center items-center">
                    {business.bankDetails?.upiId && (
                       <>
                         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`upi://pay?pa=${business.bankDetails.upiId}&pn=${business.ownerName || business.businessName}&am=${invoice.grandTotal.toFixed(2)}&cu=INR`)}`} alt="UPI QR" className="w-16 h-16 border border-gray-200 rounded p-1" />
                         <span className="text-[7px] mt-0.5">Scan to Pay (UPI)</span>
                       </>
                    )}
                 </div>
               </div>
               <div className="p-1 text-[8px]">
                  <p className="underline font-bold text-[9px] mb-1">TERMS & CONDITION</p>
                  <div className="whitespace-pre-wrap leading-tight">{tAndC}</div>
               </div>
            </div>
            
            <div className="w-[35%] flex flex-col font-bold">
               <div className="flex justify-between border-b border-black px-1 py-[3px]">
                 <span>Gross Amount :-</span><span>{(invoice.totalTaxableAmount + invoice.totalDiscount).toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-black px-1 py-[3px]">
                 <span>Discount Total :- </span><span>{invoice.totalDiscount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-black px-1 py-[3px]">
                 <span>Other Charge :-</span><span>{invoice.shippingCharge.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-black px-1 py-[3px]">
                 <span>CGST Total :- {(invoice.lineItems[0]?.gstRate / 2).toFixed(2)}%</span><span>{invoice.totalCGST.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-black px-1 py-[3px]">
                 <span>SGST Total :- {(invoice.lineItems[0]?.gstRate / 2).toFixed(2)}%</span><span>{invoice.totalSGST.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-black px-1 py-[3px]">
                 <span>IGST Total :- {invoice.lineItems[0]?.gstRate.toFixed(2)}%</span><span>{invoice.totalIGST.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-black px-1 py-[3px]">
                 <span>Tax Amount :- GST</span><span>{invoice.totalGST.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-black px-1 py-1.5 bg-gray-100 text-[11px]">
                 <span>Total Amount After Tax</span><span>{invoice.grandTotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between border-b border-black px-1 py-[3px]">
                 <span>GST Payable on Reverse Charge</span><span>0.00</span>
               </div>
               <div className="p-1 flex-1 flex flex-col justify-between items-center text-center">
                 <p className="text-[7px] mt-1 text-gray-700">Certified that the particulars given above are true and correct.</p>
                 <p className="font-bold text-[11px] mt-1">{business.businessName || business.name}</p>
                 <p className="text-[10px] mt-auto">Authorised Signatory</p>
               </div>
            </div>
          </div>

        </div>

      </div>

      {/* Non-print controls floating */}
      <div className="print:hidden fixed bottom-8 right-8 flex flex-col gap-2">
        <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-2xl hover:bg-blue-700">Print Invoice</button>
        <button onClick={() => window.close()} className="px-6 py-3 bg-white text-black border rounded-full font-bold shadow-2xl hover:bg-gray-100">Close Window</button>
      </div>

    </div>
    </>
  );
}
