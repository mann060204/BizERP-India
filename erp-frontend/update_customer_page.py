import re

def update_customer_page():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/customers/[id]/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add state for ledger
    state_to_add = """
  const [ledger, setLedger] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', mode: 'Cash', date: new Date().toISOString().split('T')[0], referenceNo: '', notes: '' });
"""
    content = content.replace("const [invoices, setInvoices] = useState<any[]>([]);", state_to_add + "  const [invoices, setInvoices] = useState<any[]>([]);")

    # 2. Add fetch ledger in useEffect
    fetch_ledger = """
      customersApi.getLedger(id as string).then(res => {
        setLedger(res.data.ledger || []);
        setCurrentBalance(res.data.currentBalance || 0);
      }).catch(console.error);
"""
    content = content.replace("customersApi.getById(id as string).then(res => {", fetch_ledger + "      customersApi.getById(id as string).then(res => {")

    # 3. Handle Payment Submission
    submit_payment = """
  const handlePaymentSubmit = async () => {
    if (!paymentForm.amount) return toast.error('Enter amount');
    try {
      await customersApi.recordPayment(id as string, paymentForm);
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      
      // Refresh ledger
      const res = await customersApi.getLedger(id as string);
      setLedger(res.data.ledger || []);
      setCurrentBalance(res.data.currentBalance || 0);
    } catch(e:any) { toast.error(e.response?.data?.message || 'Error'); }
  };
"""
    content = content.replace("const handleSave = async () => {", submit_payment + "\n  const handleSave = async () => {")

    # 4. Update the Accounts tab JSX
    old_accounts_tab = r"\{activeTab === 'Accounts' && \(\s*<div className=\"flex flex-col h-full\">\s*<h3 className=\"font-semibold text-slate-900 mb-4\">Customer Ledger \(Statement of Account\)</h3>\s*<div className=\"grid grid-cols-3 gap-4 mb-6\">\s*<div className=\"bg-\[\#F1F5F9\] border border-slate-200 p-4 rounded-xl\">\s*<div className=\"text-xs text-slate-600 uppercase\">Opening Balance</div>\s*<div className=\"text-xl font-bold mt-1 text-slate-900\">,1\{form\.openingBalance\.toFixed\(2\)\}</div>\s*</div>\s*<div className=\"bg-\[\#F1F5F9\] border border-slate-200 p-4 rounded-xl\">\s*<div className=\"text-xs text-slate-600 uppercase\">Total Billed</div>\s*<div className=\"text-xl font-bold mt-1 text-orange-400\">,1\{invoices\.reduce\(\(acc, inv\) => acc \+ \(inv\.totalAmount \|\| 0\), 0\)\.toFixed\(2\)\}</div>\s*</div>\s*<div className=\"bg-\[\#F1F5F9\] border border-slate-200 p-4 rounded-xl\">\s*<div className=\"text-xs text-slate-600 uppercase\">Total Received</div>\s*<div className=\"text-xl font-bold mt-1 text-emerald-400\">,1\{invoices\.reduce\(\(acc, inv\) => acc \+ \(inv\.amountReceived \|\| 0\), 0\)\.toFixed\(2\)\}</div>\s*</div>\s*</div>\s*<div className=\"text-sm text-slate-600 bg-\[\#F1F5F9\] p-6 rounded-xl border border-slate-200 flex items-center justify-center italic\">\s*Full transaction ledger will be generated here in future updates\.\s*</div>\s*</div>\s*\)}"
    
    new_accounts_tab = """{activeTab === 'Accounts' && (
                   <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-900">Customer Ledger (Statement of Account)</h3>
                        <button onClick={() => setShowPaymentModal(true)} className="px-4 py-2 bg-action-600 text-white text-sm font-medium rounded-lg hover:bg-action-700">
                          + Receive Payment
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#F1F5F9] border border-slate-200 p-4 rounded-xl">
                           <div className="text-xs text-slate-600 uppercase">Opening Balance</div>
                           <div className="text-xl font-bold mt-1 text-slate-900">₹{form.openingBalance?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div className="bg-[#F1F5F9] border border-slate-200 p-4 rounded-xl">
                           <div className="text-xs text-slate-600 uppercase">Current Balance</div>
                           <div className={`text-xl font-bold mt-1 ${currentBalance > 0 ? 'text-orange-500' : currentBalance < 0 ? 'text-emerald-500' : 'text-slate-900'}`}>
                             ₹{Math.abs(currentBalance).toFixed(2)} {currentBalance > 0 ? '(Dr)' : currentBalance < 0 ? '(Cr)' : ''}
                           </div>
                           <div className="text-[10px] text-slate-500 mt-1">{currentBalance > 0 ? 'Customer owes you' : 'You owe customer (Advance)'}</div>
                        </div>
                        <div className="bg-[#F1F5F9] border border-slate-200 p-4 rounded-xl">
                           <div className="text-xs text-slate-600 uppercase">Total Received (All Time)</div>
                           <div className="text-xl font-bold mt-1 text-emerald-400">₹{ledger.filter(l => l.credit > 0).reduce((acc, l) => acc + l.credit, 0).toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                        <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                                <th className="p-3 font-medium">Date</th>
                                <th className="p-3 font-medium">Particulars</th>
                                <th className="p-3 font-medium">Vch Type</th>
                                <th className="p-3 font-medium text-right">Debit (₹)</th>
                                <th className="p-3 font-medium text-right">Credit (₹)</th>
                                <th className="p-3 font-medium text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {ledger.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No transactions recorded.</td></tr>
                              ) : ledger.map(entry => (
                                <tr key={entry._id} className="hover:bg-slate-50">
                                  <td className="p-3 text-slate-700 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                                  <td className="p-3 font-medium text-slate-900">{entry.description}</td>
                                  <td className="p-3 text-slate-600 text-xs">{entry.referenceType}</td>
                                  <td className="p-3 text-right text-orange-600">{entry.debit > 0 ? entry.debit.toFixed(2) : ''}</td>
                                  <td className="p-3 text-right text-emerald-600">{entry.credit > 0 ? entry.credit.toFixed(2) : ''}</td>
                                  <td className="p-3 text-right font-medium text-slate-900">
                                    {Math.abs(entry.closingBalance || 0).toFixed(2)} 
                                    <span className="text-[10px] ml-1 text-slate-500">{(entry.closingBalance || 0) >= 0 ? 'Dr' : 'Cr'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                   </div>
                 )}"""

    content = re.sub(old_accounts_tab, new_accounts_tab, content)

    # 5. Add Payment Modal at the bottom before closing div
    payment_modal = """
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Receive Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="erp-label">Amount Received (₹)</label>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="erp-input w-full" placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="erp-label">Payment Mode</label>
                  <select value={paymentForm.mode} onChange={e => setPaymentForm({...paymentForm, mode: e.target.value})} className="erp-input w-full">
                    <option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="erp-label">Date</label>
                  <input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="erp-input w-full" />
                </div>
              </div>
              <div>
                <label className="erp-label">Reference No. (Cheque / UTR)</label>
                <input type="text" value={paymentForm.referenceNo} onChange={e => setPaymentForm({...paymentForm, referenceNo: e.target.value})} className="erp-input w-full" placeholder="Optional" />
              </div>
              <div>
                <label className="erp-label">Narration / Notes</label>
                <textarea value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} className="erp-input w-full h-20 resize-none" placeholder="Enter ledger narration..." />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
              <button onClick={handlePaymentSubmit} className="px-6 py-2 bg-action-600 text-white text-sm font-medium rounded-xl hover:bg-action-700 shadow-sm shadow-action-600/20">Record Payment</button>
            </div>
          </div>
        </div>
      )}
"""
    content = content.replace("    </div>\n  );\n}\n", payment_modal + "    </div>\n  );\n}\n")

    # Fix the generic "Accounts" logic if there was any error by running it through the tool.
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_customer_page()
print("Updated customer page!")
