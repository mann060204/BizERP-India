'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, businessApi } from '../../../../../lib/erp-api';

export default function PrintableLedger() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  const [account, setAccount] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizRes, accRes, ledgerRes] = await Promise.all([
          businessApi.getProfile(),
          customersApi.get(id as string),
          customersApi.getLedger(id as string)
        ]);
        setBusiness(bizRes.data.business);
        setAccount(accRes.data.customer || accRes.data);
        setLedger(ledgerRes.data.ledger || []);
        setTimeout(() => window.print(), 800);
      } catch (e: any) {
        toast.error(`Error: ${e.message}`);
        setAccount({ __error: e.message });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-white"><Loader2 className="w-12 h-12 animate-spin text-gray-400" /></div>;
  if (account?.__error) return <div className="p-10 text-center text-black font-bold bg-white min-h-screen">Error: {account.__error}</div>;
  if (!account || !business) return <div className="p-10 text-center text-black font-bold bg-white min-h-screen">Data not found</div>;

  const sortedLedger = [...ledger].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const txnsBeforeFromDate = fromDate ? sortedLedger.filter(t => new Date(t.date) < new Date(fromDate)) : [];
  const displayTxns = sortedLedger.filter(t => {
    if (fromDate && new Date(t.date) < new Date(fromDate)) return false;
    if (toDate && new Date(t.date) > new Date(toDate)) return false;
    return true;
  });

  // Calculate opening balance properly
  // For supplier, typically credit is positive representation in some places, but in our backend balance = Dr - Cr.
  // So opening balance is:
  let initialOpening = account.balanceType === 'Credit' 
    ? -Math.abs(account.openingBalance) 
    : Math.abs(account.openingBalance);

  const priorDr = txnsBeforeFromDate.reduce((acc, t) => acc + (t.debit || 0), 0);
  const priorCr = txnsBeforeFromDate.reduce((acc, t) => acc + (t.credit || 0), 0);
  
  let currentBal = initialOpening + priorDr - priorCr;
  let startBal = currentBal;
  let periodDr = 0;
  let periodCr = 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear().toString().slice(-2)}`;
  };

  const formatAmount = (num: number) => {
    if (!num || num === 0) return '';
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const formatBal = (b: number) => {
    if (b === 0) return '';
    return `${formatAmount(Math.abs(b))} ${b > 0 ? 'Dr' : 'Cr'}`;
  };

  const dateRangeStr = `${fromDate ? formatDate(fromDate) : '1-Apr-' + (new Date().getFullYear()-1).toString().slice(-2)} to ${toDate ? formatDate(toDate) : formatDate(new Date().toISOString())}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-container { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important;}
        }
        .tally-font { font-family: 'Arial', sans-serif; font-size: 12px; color: #000; }
        .tally-table th { border-bottom: 1px solid #000; border-top: 1px solid #000; font-weight: normal; padding: 4px 2px; }
        .tally-table td { padding: 3px 2px; }
        .tally-border-top { border-top: 1px solid #000; }
        .tally-border-bottom { border-bottom: 1px solid #000; }
        .tally-border-double { border-bottom: 3px double #000; }
      `}} />
      
      <div className="print:hidden fixed top-0 left-0 right-0 bg-slate-800 text-white p-3 flex justify-between items-center z-50 shadow-md">
        <span className="text-sm font-medium">{account.name} - Ledger</span>
        <button onClick={() => window.print()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow transition">Print</button>
      </div>

      <div className="bg-gray-100 min-h-screen text-black print:bg-white p-8 pt-20 flex justify-center tally-font">
        <div className="print-container w-[210mm] bg-white shadow-xl p-8 box-border">
          
          <div className="text-center mb-4">
            <h1 className="text-lg font-bold uppercase">{business.businessName || business.name}</h1>
            <div>{business.address?.street}</div>
            <div>{business.address?.city}, {business.address?.state} {business.gstin?.length >= 2 ? `(${business.gstin.substring(0, 2)})` : ''}</div>
            {business.email && <div>E-Mail : {business.email}</div>}
            
            <h2 className="text-[15px] font-bold mt-4">{account.name}</h2>
            <div className="text-xs">Ledger Account</div>
            <div>{account.billingAddress?.street}</div>
            <div>{account.billingAddress?.city}, {account.billingAddress?.state} {account.gstin?.length >= 2 ? `(${account.gstin.substring(0, 2)})` : ''}, {account.billingAddress?.pinCode}</div>

            <div className="mt-2 text-[11px]">{dateRangeStr}</div>
          </div>

          <div className="flex justify-end mb-1 text-[10px]">
            <span>Page 1</span>
          </div>

          <table className="w-full text-left border-collapse tally-table">
            <thead>
              <tr>
                <th className="w-[12%] pl-1">Date</th>
                <th className="w-[33%]">Particulars</th>
                <th className="w-[15%]">Vch Type</th>
                <th className="w-[10%]">Vch No.</th>
                <th className="w-[10%] text-right">Debit</th>
                <th className="w-[10%] text-right">Credit</th>
                <th className="w-[10%] text-right pr-1">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr>
                <td className="pl-1">{fromDate ? formatDate(fromDate) : '1-Apr-' + (new Date().getFullYear()-1).toString().slice(-2)}</td>
                <td className="font-bold">
                  <span className="font-normal inline-block w-6">{startBal >= 0 ? 'Dr' : 'Cr'}</span> Opening Balance
                </td>
                <td></td>
                <td></td>
                <td className="text-right font-bold">{startBal > 0 ? formatAmount(startBal) : ''}</td>
                <td className="text-right font-bold">{startBal < 0 ? formatAmount(Math.abs(startBal)) : ''}</td>
                <td className="text-right pr-1">{formatBal(startBal)}</td>
              </tr>

              {displayTxns.map((txn, idx) => {
                currentBal = currentBal + (txn.debit || 0) - (txn.credit || 0);
                periodDr += (txn.debit || 0);
                periodCr += (txn.credit || 0);
                
                let vchType = txn.referenceType || 'Journal';
                if (txn.referenceType === 'Invoice') vchType = 'Sales';
                else if (txn.referenceType === 'Payment') vchType = 'Receipt';
                else if (txn.referenceType === 'PurchaseBill') vchType = 'Purchase';

                const isDebitTxn = (txn.debit || 0) > 0;
                const prefix = isDebitTxn ? 'Cr' : 'Dr';

                return (
                  <tr key={txn._id || idx} className="align-top">
                    <td className="pl-1">{formatDate(txn.date)}</td>
                    <td>
                      <span className="inline-block w-6">{prefix}</span> {txn.description || (isDebitTxn ? 'Sale' : 'Bank A/c')}
                    </td>
                    <td>{vchType}</td>
                    <td>{txn.referenceId?.substring(0, 8) || ''}</td>
                    <td className="text-right">{txn.debit > 0 ? formatAmount(txn.debit) : ''}</td>
                    <td className="text-right">{txn.credit > 0 ? formatAmount(txn.credit) : ''}</td>
                    <td className="text-right pr-1">{formatBal(currentBal)}</td>
                  </tr>
                );
              })}
              
              <tr>
                <td colSpan={4} className="tally-border-top"></td>
                <td className="tally-border-top text-right">{formatAmount(periodDr)}</td>
                <td className="tally-border-top text-right">{formatAmount(periodCr)}</td>
                <td className="tally-border-top text-right pr-1"></td>
              </tr>

              {/* Subtotal Row */}
              <tr>
                <td className="pl-1"></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="text-right font-bold">{formatAmount(periodDr + (startBal > 0 ? startBal : 0))}</td>
                <td className="text-right font-bold">{formatAmount(periodCr + (startBal < 0 ? Math.abs(startBal) : 0))}</td>
                <td className="text-right pr-1"></td>
              </tr>

              {/* Closing Balance row */}
              <tr className="tally-border-bottom">
                <td className="pl-1 font-bold">{currentBal > 0 ? 'Dr' : (currentBal < 0 ? 'Cr' : '')}</td>
                <td className="font-bold">Closing Balance</td>
                <td></td>
                <td></td>
                <td className="text-right font-bold">{currentBal < 0 ? formatAmount(Math.abs(currentBal)) : ''}</td>
                <td className="text-right font-bold">{currentBal > 0 ? formatAmount(currentBal) : ''}</td>
                <td className="text-right pr-1"></td>
              </tr>

              {/* Final Totals */}
              <tr className="tally-border-double font-bold">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="text-right">{formatAmount(periodDr + (startBal > 0 ? startBal : 0) + (currentBal < 0 ? Math.abs(currentBal) : 0))}</td>
                <td className="text-right">{formatAmount(periodCr + (startBal < 0 ? Math.abs(startBal) : 0) + (currentBal > 0 ? currentBal : 0))}</td>
                <td className="text-right pr-1"></td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
