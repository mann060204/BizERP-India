import re
with open(r'd:\ERP WEBSITE\erp-frontend\app\dashboard\sales\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "  sent:      { label: 'Sent',     color: 'text-blue-400 bg-blue-400/10',    icon: Clock },",
    "  unpaid:    { label: 'Unpaid',   color: 'text-blue-400 bg-blue-400/10',    icon: Clock },"
)

content = content.replace(
    "  const [statusFilter, setStatusFilter] = useState('');",
    "  const [statusFilter, setStatusFilter] = useState('');\n  const [searchQuery, setSearchQuery] = useState('');"
)

content = content.replace(
    "  const handleEmail = (inv: Invoice) => {",
    """  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customerSnapshot?.name?.toLowerCase().includes(q) ||
      inv.grandTotal?.toString().includes(q)
    );
  });

  const handleEmail = (inv: Invoice) => {"""
)

content = content.replace(
    """          <h2 className="text-xl font-bold text-slate-900">All Invoices</h2>
          <Link href="/dashboard/sales/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30">
            <Plus className="w-4 h-4" /> New Invoice
          </Link>""",
    """          <h2 className="text-xl font-bold text-slate-900">All Invoices</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search invoice no, customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-slate-900"
              />
            </div>
            <Link href="/dashboard/sales/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-white/10/30 whitespace-nowrap">
              <Plus className="w-4 h-4" /> New Invoice
            </Link>
          </div>"""
)

content = content.replace(
    "        ) : invoices.length === 0 ? (",
    "        ) : filteredInvoices.length === 0 ? ("
)

content = content.replace(
    """                <tbody className="divide-y divide-[#1A1A1A]">
                  {invoices.map((inv) => {""",
    """                <tbody className="divide-y divide-[#1A1A1A]">
                  {filteredInvoices.map((inv) => {"""
)

content = content.replace(
    """                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>""",
    """                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                              <StatusIcon className="w-3 h-3" /> {sc.label}
                            </span>
                            {inv.balance > 0 && inv.status !== 'cancelled' && (
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                                {Math.max(0, Math.floor((new Date().getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 3600 * 24)))} days pending
                              </span>
                            )}
                          </div>
                        </td>"""
)

with open(r'd:\ERP WEBSITE\erp-frontend\app\dashboard\sales\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
