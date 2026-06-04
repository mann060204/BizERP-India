'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { formatAccountingBalance } from '@/lib/utils';
import toast from 'react-hot-toast';
import { customersApi, businessApi } from '../../../../../lib/erp-api';

export default function PrintableCustomerLedger() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  const [customer, setCustomer] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizRes, custRes, ledgerRes] = await Promise.all([
          businessApi.getProfile(),
          customersApi.get(id as string),
          customersApi.getLedger(id as string)
        ]);

        setBusiness(bizRes.data.business);
        setCustomer(custRes.data);
        setLedger(ledgerRes.data.ledger || []);
        
        // Auto print after rendering
        setTimeout(() => window.print(), 800);
      } catch (e: any) {
        console.error('Fetch error:', e);
        toast.error(`Error: ${e.message}`);
        setCustomer({ __error: e.message });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-white"><Loader2 className="w-12 h-12 animate-spin text-gray-400" /></div>;
  if (customer?.__error) return <div className="p-10 text-center text-red-500 font-bold bg-white min-h-screen">Error: {customer.__error}</div>;
  if (!customer || !business) return <div className="p-10 text-center text-red-500 font-bold bg-white min-h-screen">Data not found</div>;

  // Process Ledger Data
  const sortedLedger = [...ledger].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const txnsBeforeFromDate = fromDate ? sortedLedger.filter(t => new Date(t.date) < new Date(fromDate)) : [];
  const displayTxns = sortedLedger.filter(t => {
    if (fromDate && new Date(t.date) < new Date(fromDate)) return false;
    if (toDate && new Date(t.date) > new Date(toDate)) return false;
    return true;
  });

  let initialOpening = customer.balanceType === 'Credit' ? -Math.abs(customer.openingBalance) : Math.abs(customer.openingBalance);
  const priorDr = txnsBeforeFromDate.reduce((acc, t) => acc + (t.debit || 0), 0);
  const priorCr = txnsBeforeFromDate.reduce((acc, t) => acc + (t.credit || 0), 0);
  
  let currentBal = initialOpening + priorDr - priorCr;
  let startBal = currentBal;
  let periodDr = 0;
  let periodCr = 0;

  const formatBal = (b: number) => {
    return formatAccountingBalance(b, 'customer').text;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear().toString().slice(-2)}`;
  };

  const dateRangeStr = `${fromDate ? formatDate(fromDate) : 'Start'} to ${toDate ? formatDate(toDate) : formatDate(new Date().toISOString())}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-container { box-shadow: none !important; border: none !important; }
        }
      `}} />
      
      <div className="print:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white p-3 flex justify-between items-center z-50 shadow-md">
        <span className="text-sm font-medium">{customer.name} - Ledger Account</span>
        <button onClick={() => window.print()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow transition">Print / Download PDF</button>
      </div>

      <div className="bg-gray-100 min-h-screen text-black print:bg-white p-8 pt-20 font-sans flex justify-center text-[12px] leading-tight">
        <div className="print-container w-[210mm] bg-white shadow-xl p-8 print:p-0 box-border text-black font-sans">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold uppercase">{business.businessName || business.name}</h1>
            <p>{business.address?.street}</p>
            <p>{business.address?.city}, {business.address?.state} {business.gstin?.length >= 2 ? `(${business.gstin.substring(0, 2)})` : ''}</p>
            {business.email && <p>E-Mail : {business.email}</p>}
            
            <h2 className="text-base font-bold mt-4">{customer.name}</h2>
            <h3 className="text-sm font-semibold">Ledger Account</h3>
            <p>{customer.billingAddress?.street}</p>
            <p>{customer.billingAddress?.city}, {customer.billingAddress?.state} {customer.gstin?.length >= 2 ? `(${customer.gstin.substring(0, 2)})` : ''}, {customer.billingAddress?.pinCode}</p>

            <p className="mt-4 text-sm">{dateRangeStr}</p>
          </div>

          <div className="text-right mb-1">
            <span className="italic">Page 1</span>
          </div>

          {/* Ledger Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y-2 border-black font-bold">
                <th className="py-2 pl-2 w-[12%]">Date</th>
                <th className="py-2 w-[35%]">Particulars</th>
                <th className="py-2 w-[15%]">Vch Type</th>
                <th className="py-2 w-[10%]">Vch No.</th>
                <th className="py-2 text-right w-[10%]">Debit</th>
                <th className="py-2 text-right w-[10%]">Credit</th>
                <th className="py-2 text-right pr-2 w-[15%]">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr className="font-bold">
                <td className="py-1 pl-2">{fromDate ? formatDate(fromDate) : ''}</td>
                <td className="py-1">Opening Balance</td>
                <td className="py-1"></td>
                <td className="py-1"></td>
                <td className="py-1 text-right">{currentBal > 0 ? currentBal.toFixed(2) : ''}</td>
                <td className="py-1 text-right">{currentBal < 0 ? Math.abs(currentBal).toFixed(2) : ''}</td>
                <td className="py-1 text-right pr-2"></td>
              </tr>

              {/* Transactions */}
              {displayTxns.map((txn, idx) => {
                currentBal = currentBal + (txn.debit || 0) - (txn.credit || 0);
                periodDr += (txn.debit || 0);
                periodCr += (txn.credit || 0);
                
                let vchType = txn.referenceType || 'Journal';
                if (txn.referenceType === 'Invoice') vchType = 'Sales';
                else if (txn.referenceType === 'Payment') vchType = 'Receipt';

                return (
                  <tr key={txn._id || idx} className="align-top">
                    <td className="py-1 pl-2">{formatDate(txn.date)}</td>
                    <td className="py-1 pr-2">{txn.description}</td>
                    <td className="py-1">{vchType}</td>
                    <td className="py-1">{txn.referenceId || ''}</td>
                    <td className="py-1 text-right">{txn.debit > 0 ? txn.debit.toFixed(2) : ''}</td>
                    <td className="py-1 text-right">{txn.credit > 0 ? txn.credit.toFixed(2) : ''}</td>
                    <td className="py-1 text-right pr-2">{formatBal(currentBal)}</td>
                  </tr>
                );
              })}
              
              {/* Totals Underline */}
              <tr>
                <td colSpan={7} className="border-t border-black pt-1"></td>
              </tr>

              {/* Subtotal */}
              <tr className="font-bold">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="py-1 text-right">{periodDr.toFixed(2)}</td>
                <td className="py-1 text-right">{periodCr.toFixed(2)}</td>
                <td></td>
              </tr>

              {/* Closing Balance / Totals */}
              <tr className="font-bold border-b border-black">
                <td className="py-1 pl-2"></td>
                <td className="py-1 text-right pr-4">{currentBal >= 0 ? 'Dr' : 'Cr'}</td>
                <td className="py-1" colSpan={2}>Closing Balance</td>
                <td className="py-1 text-right">{currentBal < 0 ? Math.abs(currentBal).toFixed(2) : ''}</td>
                <td className="py-1 text-right">{currentBal >= 0 ? currentBal.toFixed(2) : ''}</td>
                <td className="py-1"></td>
              </tr>
              
              {/* Grand Total */}
              <tr className="font-bold border-b-2 border-black">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="py-1 text-right">{(periodDr + (startBal > 0 ? startBal : 0) + (currentBal < 0 ? Math.abs(currentBal) : 0)).toFixed(2)}</td>
                <td className="py-1 text-right">{(periodCr + (startBal < 0 ? Math.abs(startBal) : 0) + (currentBal >= 0 ? currentBal : 0)).toFixed(2)}</td>
                <td></td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
