'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  X, Search, User, Briefcase, FileText, 
  CreditCard, Calendar, FileType, CheckCircle2, Loader2, AlertCircle 
} from 'lucide-react';
import { customersApi, suppliersApi, invoicesApi, purchasesApi, banksApi } from '../../../lib/erp-api';
import toast from 'react-hot-toast';

type ModalMode = 'IN' | 'OUT';

interface QuickPaymentModalProps {
  mode: ModalMode;
  onClose: () => void;
}

export default function QuickPaymentModal({ mode, onClose }: QuickPaymentModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [entities, setEntities] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);

  const [paymentView, setPaymentView] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  
  const [banks, setBanks] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [bankId, setBankId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const searchDebounce = useRef<NodeJS.Timeout>();

  const isCustomer = mode === 'IN';
  const api = isCustomer ? customersApi : suppliersApi;
  const billApi = isCustomer ? invoicesApi : purchasesApi;

  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const res = await banksApi.list();
        setBanks(res.data || []);
      } catch (err) {
        toast.error('Failed to load banks');
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setEntities([]);
      return;
    }
    setLoadingSearch(true);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await api.list({ search: searchTerm, limit: 10 });
        setEntities(isCustomer ? res.data.customers : res.data.suppliers);
      } catch (err) {
        toast.error('Failed to search');
      } finally {
        setLoadingSearch(false);
      }
    }, 500);
  }, [searchTerm, isCustomer]);

  const selectEntity = async (entity: any) => {
    setSelectedEntity(entity);
    setSearchTerm('');
    setEntities([]);
    setLoadingBills(true);
    
    try {
      const res = await billApi.list(isCustomer ? { customerId: entity._id } : { supplierId: entity._id });
      const items = isCustomer ? res.data.invoices : res.data.purchases;
      const pending = items.filter((b: any) => b.balance > 0 && b.status !== 'cancelled');
      setPendingBills(pending);
    } catch (err) {
      toast.error('Failed to fetch pending bills');
    } finally {
      setLoadingBills(false);
    }
  };

  const handlePayClick = (bill?: any) => {
    if (bill) {
      setSelectedBill(bill);
      setAmount(bill.balance.toString());
    } else {
      setSelectedBill(null);
      setAmount('');
    }
    setPaymentView('FORM');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedBill) {
        // Pay against specific bill
        const existingAmount = isCustomer ? selectedBill.amountReceived : selectedBill.amountPaid;
        const newTotal = Number(existingAmount || 0) + Number(amount);
        
        const payload = isCustomer 
          ? { amountReceived: newTotal, paymentMode, paymentBankId: bankId, paymentAmount: Number(amount), paymentDate } 
          : { amountPaid: newTotal, paymentMode, paymentBankId: bankId, paymentAmount: Number(amount), paymentDate };
          
        await billApi.updateStatus(selectedBill._id, payload);
        toast.success(`Payment mapped to ${isCustomer ? 'Invoice' : 'Bill'} successfully!`);
      } else {
        // Generic payment
        await api.recordPayment(selectedEntity._id, {
          amount: Number(amount),
          paymentMode,
          bankId,
          date: paymentDate,
          referenceNo,
          notes
        });
        toast.success('Payment recorded successfully!');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className={`p-5 flex items-center justify-between text-white ${isCustomer ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <div>
            <h2 className="text-xl font-bold">Payment {isCustomer ? 'In (Received)' : 'Out (Paid)'}</h2>
            <p className="text-sm opacity-90 font-medium">
              {isCustomer ? 'Record payment received from a customer' : 'Record payment made to a supplier'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* Step 1: Search Entity */}
          {!selectedEntity && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Search {isCustomer ? 'Customer' : 'Supplier'}</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search by name, mobile...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition font-medium"
                />
                {loadingSearch && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-indigo-500 animate-spin" />}
              </div>

              {entities.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                  {entities.map(ent => (
                    <div 
                      key={ent._id} 
                      onClick={() => selectEntity(ent)}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCustomer ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {isCustomer ? <User className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition">{ent.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{ent.mobile || 'No mobile'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Balance</p>
                        <p className={`font-bold ${ent.currentBalance > 0 ? (isCustomer ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-600'}`}>
                          ₹{Math.abs(ent.currentBalance).toLocaleString('en-IN')} {ent.currentBalance >= 0 ? (isCustomer ? 'Dr' : 'Dr') : 'Cr'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Entity Selected */}
          {selectedEntity && (
            <div className="space-y-6">
              
              {/* Selected Entity Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Selected {isCustomer ? 'Customer' : 'Supplier'}</p>
                  <p className="font-bold text-lg text-slate-900">{selectedEntity.name}</p>
                  <p className="text-sm font-medium text-slate-500">{selectedEntity.mobile}</p>
                </div>
                <button 
                  onClick={() => { setSelectedEntity(null); setPaymentView('LIST'); }}
                  className="px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Change
                </button>
              </div>

              {/* LIST VIEW (Pending Bills) */}
              {paymentView === 'LIST' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Pending Bills</h3>
                    <button 
                      onClick={() => handlePayClick()}
                      className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition ${isCustomer ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                    >
                      Generic Payment (No Bill)
                    </button>
                  </div>

                  {loadingBills ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                  ) : pendingBills.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed rounded-xl p-8 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <p className="font-bold text-slate-700">No pending bills found.</p>
                      <p className="text-sm text-slate-500 font-medium mt-1">They are all caught up!</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                      {pendingBills.map(bill => (
                        <div key={bill._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                          <div>
                            <p className="font-bold text-slate-900">{bill.invoiceNumber || bill.billNumber}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {new Date(bill.invoiceDate || bill.billDate).toLocaleDateString('en-IN')} • 
                              Total: ₹{bill.grandTotal.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pending</p>
                              <p className="font-bold text-orange-600">₹{bill.balance.toLocaleString('en-IN')}</p>
                            </div>
                            <button 
                              onClick={() => handlePayClick(bill)}
                              className={`px-3 py-1.5 text-sm font-bold text-white rounded-lg transition ${isCustomer ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                            >
                              Pay
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* FORM VIEW (Payment Entry) */}
              {paymentView === 'FORM' && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                      {selectedBill ? `Payment against ${selectedBill.invoiceNumber || selectedBill.billNumber}` : 'Generic Payment (On Account)'}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setPaymentView('LIST')}
                      className="text-sm font-bold text-slate-500 hover:text-slate-700"
                    >
                      Back to list
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Amount (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-lg"
                        placeholder="0.00"
                      />
                      {selectedBill && (
                        <p className="text-xs font-medium text-slate-500 text-right mt-1">
                          Pending: ₹{selectedBill.balance.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Payment Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          required
                          value={paymentDate}
                          onChange={e => setPaymentDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Payment Mode *</label>
                      <select
                        value={paymentMode}
                        onChange={e => setPaymentMode(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-medium bg-white"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>

                    {['Bank Transfer', 'UPI', 'Cheque'].includes(paymentMode) && (
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-sm font-bold text-slate-700">Select Bank Account *</label>
                        <select
                          required
                          value={bankId}
                          onChange={e => setBankId(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-medium bg-white"
                        >
                          <option value="">-- Select Bank --</option>
                          {banks.map(b => (
                            <option key={b._id} value={b._id}>{b.bankName} - {b.accountNumber}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Reference No (Optional)</label>
                      <input
                        type="text"
                        value={referenceNo}
                        onChange={e => setReferenceNo(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-medium"
                        placeholder="UTR / Cheque No"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Notes</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-medium resize-none h-20"
                      placeholder="Payment notes..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3 rounded-xl text-white font-bold text-lg shadow-sm transition flex items-center justify-center gap-2 ${isCustomer ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    Confirm Payment
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
