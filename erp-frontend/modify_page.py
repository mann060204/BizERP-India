import os
import re

file_path = 'app/dashboard/settings/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
state_addition = """  const [customYearLabel, setCustomYearLabel] = useState('');
  const [showFyModal, setShowFyModal] = useState(false);
  const [fyConfig, setFyConfig] = useState({
    carryForwardStock: true,
    carryForwardCustomerBalances: true,
    carryForwardSupplierBalances: true,
    carryForwardBankBalances: true,
    lockPreviousFY: true
  });"""
content = content.replace("  const [customYearLabel, setCustomYearLabel] = useState('');", state_addition)

# Add isLocked to save
content = content.replace("enableManufacturing: form.enableManufacturing || false\n      });", "enableManufacturing: form.enableManufacturing || false,\n        isLocked: form.isLocked || false\n      });")

# Replace handleStartNewYear and add handleUnlockYear
old_handle = """  const handleStartNewYear = async () => {
    if (!confirm('Are you sure you want to start a new financial year? This will create a fresh workspace and reset all invoice counters to 1. Your current data will remain safe in this year\\'s profile.')) {
      return;
    }
    setStartingNewYear(true);
    try {
      const res = await financialYearApi.startNewYear(customYearLabel);
      toast.success(res.message || 'New financial year started successfully!');
      if (res.token) {
        localStorage.setItem('erp_token', res.token);
      }
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to start new year');
      setStartingNewYear(false);
    }
  };"""

new_handle = """  const handleStartNewYear = async () => {
    setStartingNewYear(true);
    try {
      const res = await financialYearApi.startNewYear({ customYearLabel, ...fyConfig });
      toast.success(res.message || 'New financial year started successfully!');
      if (res.token) {
        localStorage.setItem('erp_token', res.token);
      }
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to start new year');
      setStartingNewYear(false);
    }
  };

  const handleUnlockYear = async () => {
    if (!confirm('Are you sure you want to unlock this financial year? Users will be able to add and edit transactions in this past year.')) return;
    setSaving(true);
    try {
      await businessApi.updateProfile({ isLocked: false });
      toast.success('Financial year unlocked successfully');
      setForm({ ...form, isLocked: false });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to unlock year');
    } finally {
      setSaving(false);
    }
  };"""
content = content.replace(old_handle, new_handle)


# Add unlock banner in Business Tab
old_business_end = """            </div>

          </div>
        ) : activeTab === 'sequences' ? ("""

new_business_end = """            </div>
              
              {form.isLocked && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col md:flex-row md:items-center gap-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                    <ShieldCheck className="w-16 h-16 text-amber-600" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 relative z-10">
                    <h4 className="text-sm font-bold text-amber-900">This Financial Year is Locked</h4>
                    <p className="text-xs text-amber-700 mt-1 max-w-sm">Users cannot add, edit, or delete transactions in this year to prevent accidental changes to closed books.</p>
                  </div>
                  <button onClick={handleUnlockYear} disabled={saving} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition shrink-0 relative z-10 shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Unlock Year'}
                  </button>
                </div>
              )}
          </div>
        ) : activeTab === 'sequences' ? ("""
content = content.replace(old_business_end, new_business_end)

# Replace the old handleStartNewYear UI with the modal trigger
old_ui = """                 <div className="mt-4 space-y-3">
                   <div>
                     <label className="block text-xs font-medium text-slate-600 mb-1.5">Custom Year Label (Optional)</label>
                     <input 
                       value={customYearLabel} 
                       onChange={(e) => setCustomYearLabel(e.target.value)} 
                       placeholder="e.g. FY 2026-27"
                       className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-300 text-sm transition" 
                     />
                   </div>
                   <button onClick={handleStartNewYear} disabled={startingNewYear} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition text-sm font-bold text-purple-700 disabled:opacity-50">
                     {startingNewYear ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />} 
                     Start New Financial Year
                   </button>
                 </div>
               </div>
             </div>

          </div>
        )}
      </main>
    </div>
  );
}"""

new_ui = """                 <div className="mt-4 space-y-3">
                    <button onClick={() => setShowFyModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition text-sm font-bold text-purple-700">
                      <CalendarDays className="w-4 h-4" /> 
                      Start New Financial Year Setup
                    </button>
                  </div>
               </div>
             </div>

          </div>
        )}
      </main>
      
      {/* FY Transition Modal */}
      {showFyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Financial Year Closing</h3>
                  <p className="text-xs text-slate-500">Configure your new financial year</p>
                </div>
              </div>
              <button onClick={() => setShowFyModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Custom Year Label (Optional)</label>
                  <input 
                    value={customYearLabel} 
                    onChange={(e) => setCustomYearLabel(e.target.value)} 
                    placeholder={`e.g. FY ${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(2)}`}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-sm transition" 
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carry Forward Options</h4>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <span className="text-sm font-semibold text-slate-700">Carry Forward Stock</span>
                    <input type="checkbox" checked={fyConfig.carryForwardStock} onChange={e => setFyConfig(prev => ({ ...prev, carryForwardStock: e.target.checked }))} className="w-4 h-4 text-purple-600 rounded" />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <span className="text-sm font-semibold text-slate-700">Carry Forward Customer Balances</span>
                    <input type="checkbox" checked={fyConfig.carryForwardCustomerBalances} onChange={e => setFyConfig(prev => ({ ...prev, carryForwardCustomerBalances: e.target.checked }))} className="w-4 h-4 text-purple-600 rounded" />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <span className="text-sm font-semibold text-slate-700">Carry Forward Supplier Balances</span>
                    <input type="checkbox" checked={fyConfig.carryForwardSupplierBalances} onChange={e => setFyConfig(prev => ({ ...prev, carryForwardSupplierBalances: e.target.checked }))} className="w-4 h-4 text-purple-600 rounded" />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <span className="text-sm font-semibold text-slate-700">Carry Forward Cash & Bank Balances</span>
                    <input type="checkbox" checked={fyConfig.carryForwardBankBalances} onChange={e => setFyConfig(prev => ({ ...prev, carryForwardBankBalances: e.target.checked }))} className="w-4 h-4 text-purple-600 rounded" />
                  </label>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security</h4>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50 cursor-pointer transition">
                    <div>
                      <span className="text-sm font-semibold text-amber-900 block">Lock Previous Financial Year</span>
                      <span className="text-xs text-amber-700">Prevents edits to old transactions</span>
                    </div>
                    <input type="checkbox" checked={fyConfig.lockPreviousFY} onChange={e => setFyConfig(prev => ({ ...prev, lockPreviousFY: e.target.checked }))} className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500" />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setShowFyModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-white transition">Cancel</button>
              <button onClick={handleStartNewYear} disabled={startingNewYear} className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
                {startingNewYear ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Create New Year
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}"""

content = content.replace(old_ui, new_ui)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated settings/page.tsx")
