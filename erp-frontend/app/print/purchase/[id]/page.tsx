'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if ((num = num.toString().replace(/[\, ]/g, '') as any) != parseFloat(num as any)) return 'Not a Number';
  let n = parseInt(num as any, 10);
  if (n === 0) return 'Zero';
  let str = '';
  if (n > 9999999) { str += numberToWords(Math.floor(n / 10000000)) + 'Crore '; n %= 10000000; }
  if (n > 99999) { str += numberToWords(Math.floor(n / 100000)) + 'Lakh '; n %= 100000; }
  if (n > 999) { str += numberToWords(Math.floor(n / 1000)) + 'Thousand '; n %= 1000; }
  if (n > 99) { str += a[Math.floor(n / 100)] + 'Hundred '; n %= 100; }
  if (n > 0) {
    if (n < 20) str += a[n];
    else { str += b[Math.floor(n / 10)] + ' '; if (n % 10 > 0) str += a[n % 10]; }
  }
  return str.trim();
}

export default function PrintablePurchasePage() {
  const { id } = useParams();
  const [purchase, setOrder] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use Next.js rewrite proxy to avoid local network/firewall and CORS issues on phones
        const isDev = process.env.NODE_ENV !== 'production';
        const fetchUrl = isDev 
          ? `/backend-api/public/purchases/${id}`
          : `https://bizerp-api.vercel.app/api/v1/public/purchases/${id}`;
          
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);

        
        const data = await res.json();
        setOrder(data.purchase);
        setBusiness(data.business);
        
        setTimeout(() => window.print(), 800);
      } catch (e) {
        toast.error('Failed to load Purchase Bill for printing');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-white"><Loader2 className="w-12 h-12 animate-spin text-gray-400" /></div>;
  if (!purchase || !business) return <div className="p-10 text-center text-red-500 font-bold bg-white min-h-screen">Purchase Bill not found</div>;

  const isInterState = purchase.isInterState;
  const isNonGst = purchase.purchaseType === 'NON-GST';
  const tAndC = purchase.termsAndConditions || business.termsAndConditions || '1. This is a Purchase Bill only — prices may vary.\n2. Valid for 30 days from Purchase Bill date.\n3. Subject to availability of goods.';

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .a4-page { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 10mm !important; }
        }
      `}} />
      <div className="bg-[#525659] min-h-screen text-black print:bg-white print:p-0 p-8 font-sans flex justify-center text-[11px]">
        <div className="a4-page w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none p-8 print:p-0 box-bpurchase relative flex flex-col overflow-hidden">
        
        <div className="bpurchase-2 bpurchase-gray-800 flex-1 flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-start bpurchase-b-2 bpurchase-gray-800 p-2">
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
              <h2 className="text-2xl font-black uppercase tracking-widest text-gray-800 bpurchase-b-2 bpurchase-gray-800 pb-1 mb-2">Purchase Bill</h2>
              {!isNonGst && <p className="text-[11px] font-bold mt-1 text-gray-700">GSTIN: {business.gstin}</p>}
              {business.pan && <p className="text-[11px] font-bold text-gray-700">PAN: {business.pan}</p>}
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 bpurchase-b-2 bpurchase-gray-800 text-[10px]">
            {/* Bill To */}
            <div className="bpurchase-r-2 bpurchase-gray-800 p-2 flex flex-col">
              <div className="font-bold text-blue-900 mb-1 bpurchase-b bpurchase-gray-300 pb-1">Supplier Detail</div>
              <div className="grid grid-cols-[60px_1fr] gap-x-1 font-semibold text-gray-800">
                <span>Name</span><span>: {purchase.supplierSnapshot?.name?.toUpperCase()}</span>
                <span>Address</span><span className="whitespace-pre-wrap leading-tight">: {purchase.supplierSnapshot?.address?.toUpperCase() || 'N/A'}</span>
                <span>Contact</span><span>: {purchase.supplierSnapshot?.mobile || purchase.contactNo || 'N/A'}</span>
                {!isNonGst && <><span>GSTIN</span><span>: {purchase.supplierSnapshot?.gstin || 'N/A'}</span></>}
                <span>State</span><span>: {purchase.placeOfSupply?.toUpperCase() || 'N/A'} {purchase.supplierSnapshot?.gstin && purchase.supplierSnapshot.gstin.length >= 2 ? `(${purchase.supplierSnapshot.gstin.substring(0, 2)})` : ''}</span>
              </div>
            </div>
            {/* Purchase Bill Meta */}
            <div className="p-2 flex flex-col">
              <div className="font-bold text-blue-900 mb-1 bpurchase-b bpurchase-gray-300 pb-1">Purchase Bill Details</div>
              <div className="grid grid-cols-[100px_1fr] gap-x-1 font-semibold text-gray-800">
                <span>Purchase Bill No.</span><span>: {purchase.billNumber}</span>
                <span>Purchase Bill Date</span><span>: {new Date(purchase.billDate).toLocaleDateString('en-GB')}</span>
                {purchase.dueDate && <><span>Valid Till</span><span>: {new Date(purchase.dueDate).toLocaleDateString('en-GB')}</span></>}
                <span>Payment Mode</span><span>: {purchase.paymentMode || 'N/A'}</span>
                {purchase.deliveryTerms && <><span>Transport</span><span className="whitespace-pre-wrap leading-tight">: {purchase.deliveryTerms}</span></>}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 flex flex-col min-h-[200px] overflow-hidden">
            <table className="w-full text-center bpurchase-collapse h-full text-[10px] table-fixed font-semibold text-gray-800">
              <thead>
                <tr className="bpurchase-b-2 bpurchase-gray-800 bg-action-50 text-blue-900">
                  <th className="bpurchase-r-2 bpurchase-gray-800 p-1 w-[4%]">Sr</th>
                  <th className={`bpurchase-r-2 bpurchase-gray-800 p-1 text-left ${isNonGst ? 'w-[60%]' : 'w-[32%]'}`}>Product / Service Description</th>
                  {!isNonGst && <th className="bpurchase-r-2 bpurchase-gray-800 p-1 w-[10%]">HSN/SAC</th>}
                  <th className={`bpurchase-r-2 bpurchase-gray-800 p-1 ${isNonGst ? 'w-[12%]' : 'w-[8%]'}`}>Qty</th>
                  <th className={`bpurchase-r-2 bpurchase-gray-800 p-1 ${isNonGst ? 'w-[12%]' : 'w-[10%]'}`}>Rate</th>
                  {!isNonGst && <th className="bpurchase-r-2 bpurchase-gray-800 p-1 w-[12%]">Taxable</th>}
                  {!isNonGst && (
                    <th className="bpurchase-r-2 bpurchase-gray-800 p-0 w-[12%]">
                      <div className="bpurchase-b-2 bpurchase-gray-800 pb-[1px]">GST</div>
                      <div className="flex"><span className="w-1/2 bpurchase-r-2 bpurchase-gray-800">%</span><span className="w-1/2">Amt</span></div>
                    </th>
                  )}
                  <th className="p-1 w-[12%]">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.lineItems.map((item: any, idx: number) => {
                  const taxAmt = item.cgst + item.sgst + item.igst;
                  const totalAmt = item.taxableAmount + taxAmt;
                  return (
                    <tr key={idx} className="align-top bpurchase-b bpurchase-gray-200">
                      <td className="bpurchase-r-2 bpurchase-gray-800 px-1 py-1">{idx + 1}</td>
                      <td className="bpurchase-r-2 bpurchase-gray-800 px-1 py-1 text-left">
                        <span className="font-bold text-gray-900">{item.productName?.toUpperCase()}</span>
                        {item.description && <span className="block text-[8px] text-gray-500">{item.description.toUpperCase()}</span>}
                      </td>
                      {!isNonGst && <td className="bpurchase-r-2 bpurchase-gray-800 px-1 py-1">{item.hsnCode || '-'}</td>}
                      <td className="bpurchase-r-2 bpurchase-gray-800 px-1 py-1">{item.quantity} {item.unit}</td>
                      <td className="bpurchase-r-2 bpurchase-gray-800 px-1 py-1 text-right">{item.rate.toFixed(2)}</td>
                      {!isNonGst && <td className="bpurchase-r-2 bpurchase-gray-800 px-1 py-1 text-right">{item.taxableAmount.toFixed(2)}</td>}
                      {!isNonGst && (
                        <td className="bpurchase-r-2 bpurchase-gray-800 p-0">
                           <div className="flex h-full min-h-[24px]">
                             <span className="w-1/2 bpurchase-r-2 bpurchase-gray-800 pt-[2px]">{item.gstRate}%</span>
                             <span className="w-1/2 pt-[2px] text-right pr-1">{taxAmt.toFixed(2)}</span>
                           </div>
                        </td>
                      )}
                      <td className="px-1 py-1 text-right">{isNonGst ? (item.quantity * item.rate).toFixed(2) : totalAmt.toFixed(2)}</td>
                    </tr>
                  );
                })}
                {/* Filler space */}
                <tr className="flex-1 h-full">
                  <td className="bpurchase-r-2 bpurchase-gray-800"></td><td className="bpurchase-r-2 bpurchase-gray-800"></td>
                  {!isNonGst && <td className="bpurchase-r-2 bpurchase-gray-800"></td>}
                  <td className="bpurchase-r-2 bpurchase-gray-800"></td><td className="bpurchase-r-2 bpurchase-gray-800"></td>
                  {!isNonGst && <td className="bpurchase-r-2 bpurchase-gray-800"></td>}
                  {!isNonGst && <td className="bpurchase-r-2 bpurchase-gray-800 p-0"><div className="flex h-full"><span className="w-1/2 bpurchase-r-2 bpurchase-gray-800"></span><span className="w-1/2"></span></div></td>}
                  <td></td>
                </tr>
                {/* Total Row */}
                <tr className="bpurchase-t-2 bpurchase-gray-800 bg-action-50 h-6 font-bold text-blue-900">
                  <td className="bpurchase-r-2 bpurchase-gray-800"></td>
                  <td className="bpurchase-r-2 bpurchase-gray-800 text-right pr-2">Sub-Total:</td>
                  {!isNonGst && <td className="bpurchase-r-2 bpurchase-gray-800"></td>}
                  <td className="bpurchase-r-2 bpurchase-gray-800">{purchase.lineItems.reduce((s:any, i:any)=>s + i.quantity, 0)}</td>
                  <td className="bpurchase-r-2 bpurchase-gray-800"></td>
                  {!isNonGst && <td className="bpurchase-r-2 bpurchase-gray-800 text-right pr-1">{purchase.totalTaxableAmount.toFixed(2)}</td>}
                  {!isNonGst && (
                    <td className="bpurchase-r-2 bpurchase-gray-800 p-0">
                       <div className="flex h-full">
                         <span className="w-1/2 bpurchase-r-2 bpurchase-gray-800"></span>
                         <span className="w-1/2 text-right pr-1 pt-[2px]">{purchase.totalGST.toFixed(2)}</span>
                       </div>
                    </td>
                  )}
                  <td className="text-right pr-1">{isNonGst ? purchase.subtotal.toFixed(2) : (purchase.totalTaxableAmount + purchase.totalGST).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex bpurchase-t-2 bpurchase-gray-800 text-[10px] font-bold min-h-[14rem] bg-white">
            {/* Left Side */}
            <div className="w-[65%] flex flex-col bpurchase-r-2 bpurchase-gray-800">
               <div className="bpurchase-b-2 bpurchase-gray-800 px-2 py-1 flex justify-between bg-action-50 text-blue-900">
                 <span>Purchase Bill Total in Words:</span>
                 <span className="italic uppercase">Rupees {numberToWords(Math.round(purchase.grandTotal))} Only</span>
               </div>
               <div className="p-2 text-[8.5px] text-gray-700">
                  <p className="font-bold text-[10px] mb-1 text-blue-900 uppercase">Terms & Conditions / Declaration:</p>
                  <div className="whitespace-pre-wrap leading-tight">{tAndC}</div>
               </div>
            </div>
            {/* Right Side (Summary Totals) */}
            <div className="w-[35%] flex flex-col font-bold text-gray-800">
               <div className="flex justify-between bpurchase-b-2 bpurchase-gray-800 px-2 py-1 bg-action-50 text-blue-900">
                 <span>SUMMARY</span><span>AMOUNT</span>
               </div>
               <div className="flex justify-between bpurchase-b bpurchase-gray-300 px-2 py-1">
                 <span>{isNonGst ? 'Subtotal :' : 'Taxable Amount :'}</span><span>{isNonGst ? purchase.subtotal.toFixed(2) : purchase.totalTaxableAmount.toFixed(2)}</span>
               </div>
               {!isNonGst && (
                 <>
                   {isInterState ? (
                     <div className="flex justify-between bpurchase-b bpurchase-gray-300 px-2 py-1">
                       <span>IGST Amt :</span><span>{purchase.totalIGST.toFixed(2)}</span>
                     </div>
                   ) : (
                     <>
                       <div className="flex justify-between bpurchase-b bpurchase-gray-300 px-2 py-1">
                         <span>CGST Amt :</span><span>{purchase.totalCGST.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between bpurchase-b bpurchase-gray-300 px-2 py-1">
                         <span>SGST Amt :</span><span>{purchase.totalSGST.toFixed(2)}</span>
                       </div>
                     </>
                   )}
                 </>
               )}
               <div className="flex justify-between bpurchase-b bpurchase-gray-300 px-2 py-1">
                 <span>Discount :</span><span className="text-red-600">-{purchase.totalDiscount.toFixed(2)}</span>
               </div>
               {purchase.shippingCharge > 0 && (
                 <div className="flex justify-between bpurchase-b bpurchase-gray-300 px-2 py-1">
                   <span>Shipping / Freight :</span><span>{purchase.shippingCharge.toFixed(2)}</span>
                 </div>
               )}
               <div className="flex justify-between bpurchase-b-2 bpurchase-gray-800 px-2 py-1.5 bg-action-100 text-[13px] text-blue-900">
                 <span>Total Amount :</span><span>{purchase.grandTotal.toFixed(2)}</span>
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
          This is a computer generated Purchase Bill — not a tax invoice.
        </div>

      </div>

      {/* Non-print controls floating */}
      <div className="print:hidden fixed bottom-8 right-8 flex flex-col gap-2">
        <button onClick={() => window.print()} className="px-6 py-3 bg-action-500 text-slate-900 rounded-full font-bold shadow-2xl hover:bg-action-600">Print Purchase Bill</button>
        <button onClick={() => window.close()} className="px-6 py-3 bg-action-500 text-white bpurchase rounded-full font-bold shadow-2xl hover:bg-gray-100">Close Window</button>
      </div>
    </div>
    </>
  );
}

