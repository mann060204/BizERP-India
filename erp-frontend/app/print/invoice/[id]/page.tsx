'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { invoicesApi, businessApi } from '../../../../lib/erp-api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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

  return (
    <div className="bg-white min-h-screen text-black print:p-0 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 print:border-none p-10 print:p-0 shadow-lg print:shadow-none">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
          <div className="flex items-center gap-4">
            {business.logo && (
              <img src={business.logo} alt="Business Logo" className="w-24 h-24 object-contain" />
            )}
            <div>
              <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900">{business.businessName || business.name}</h1>
              {business.gstin && <p className="text-sm font-bold mt-1">GSTIN: {business.gstin}</p>}
              <p className="text-sm text-gray-600 max-w-xs mt-1">
                {business.address?.street}, {business.address?.city}, {business.address?.state} - {business.address?.pinCode}
              </p>
              <p className="text-sm text-gray-600">Ph: {business.mobile || business.phone} | {business.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-light text-gray-400 uppercase tracking-widest mb-4">Tax Invoice</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-left inline-block">
              <span className="font-semibold text-gray-500">Invoice No:</span>
              <span className="font-bold">{invoice.invoiceNumber}</span>
              <span className="font-semibold text-gray-500">Date:</span>
              <span className="font-bold">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span>
              <span className="font-semibold text-gray-500">Due Date:</span>
              <span className="font-bold">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span>
              <span className="font-semibold text-gray-500">Status:</span>
              <span className="font-bold uppercase">{invoice.status}</span>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 border-b pb-2">Bill To</h3>
          <h4 className="text-lg font-bold text-gray-900">{invoice.customerSnapshot.name}</h4>
          {invoice.customerSnapshot.gstin && <p className="text-sm font-semibold">GSTIN: {invoice.customerSnapshot.gstin}</p>}
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{invoice.customerSnapshot.billingAddress || 'Address not provided'}</p>
          <p className="text-sm text-gray-600 mt-1">Ph: {invoice.customerSnapshot.mobile}</p>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="py-3 px-4 text-left font-semibold">Item & Description</th>
              <th className="py-3 px-4 text-center font-semibold">HSN/SAC</th>
              <th className="py-3 px-4 text-right font-semibold">Qty</th>
              <th className="py-3 px-4 text-right font-semibold">Rate</th>
              <th className="py-3 px-4 text-right font-semibold">GST %</th>
              <th className="py-3 px-4 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-4 px-4">
                  <p className="font-bold text-gray-900">{item.name}</p>
                </td>
                <td className="py-4 px-4 text-center text-gray-600">{item.hsnCode || '-'}</td>
                <td className="py-4 px-4 text-right text-gray-900">{item.quantity}</td>
                <td className="py-4 px-4 text-right text-gray-900">₹{item.rate.toFixed(2)}</td>
                <td className="py-4 px-4 text-right text-gray-600">{item.gstRate}%</td>
                <td className="py-4 px-4 text-right font-bold text-gray-900">₹{(item.taxableAmount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-1/2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Subtotal (Taxable)</span>
              <span className="font-semibold">₹{invoice.totalTaxableAmount.toFixed(2)}</span>
            </div>
            {invoice.isInterState ? (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">IGST</span>
                <span className="font-semibold text-gray-600">₹{invoice.totalIGST.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">CGST</span>
                  <span className="font-semibold text-gray-600">₹{invoice.totalCGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">SGST</span>
                  <span className="font-semibold text-gray-600">₹{invoice.totalSGST.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-3 border-b-2 border-gray-800 text-lg">
              <span className="font-bold text-gray-900">Grand Total</span>
              <span className="font-black text-gray-900">₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-500">Amount Received ({invoice.paymentMode})</span>
              <span className="text-green-600 font-semibold">₹{invoice.amountReceived.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm bg-gray-100 px-2 mt-1 font-bold">
              <span className="text-gray-900">Balance Due</span>
              <span className="text-red-600">₹{invoice.balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-6 mt-12 flex justify-between text-sm text-gray-600">
          <div className="max-w-md">
            <h5 className="font-bold text-gray-900 mb-1">Terms & Conditions</h5>
            <p className="whitespace-pre-wrap">{invoice.termsAndConditions || '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is delayed.'}</p>
          </div>
          <div className="text-center mt-8">
            <p className="font-bold text-gray-900">For {business.businessName || business.name}</p>
            <div className="mt-12 border-t border-gray-400 pt-2 px-8 inline-block">
              Authorized Signatory
            </div>
          </div>
        </div>
        
        {/* Non-print controls */}
        <div className="print:hidden mt-10 flex justify-center gap-4 border-t pt-6">
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700">Print Invoice</button>
          <button onClick={() => window.close()} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold shadow hover:bg-gray-300">Close Window</button>
        </div>
      </div>
    </div>
  );
}
