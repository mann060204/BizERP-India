import re

with open('d:/ERP WEBSITE/erp-frontend/app/dashboard/manufacturing/bom/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
content = content.replace("const [components, setComponents] = useState<any[]>([]);", """const [components, setComponents] = useState<any[]>([]);
  const [scrapItems, setScrapItems] = useState<any[]>([]);""")

# Add handleAddComponent -> also add handleAddScrap
content = content.replace("const handleAddComponent = () => {", """
  const handleAddScrap = () => {
    setScrapItems([...scrapItems, { productId: '', productName: '', quantity: 1, recoveryCostPerUnit: 0, unit: 'Nos', totalRecoveryValue: 0 }]);
  };

  const updateScrap = (index: number, field: string, value: any) => {
    const updated = [...scrapItems];
    updated[index][field] = value;
    if (field === 'productId') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        updated[index].productName = prod.name;
        updated[index].recoveryCostPerUnit = prod.sellingPrice || 0;
        updated[index].unit = prod.unit || 'Nos';
      }
    }
    updated[index].totalRecoveryValue = updated[index].quantity * updated[index].recoveryCostPerUnit;
    setScrapItems(updated);
  };

  const removeScrap = (index: number) => {
    setScrapItems(scrapItems.filter((_, i) => i !== index));
  };

  const handleAddComponent = () => {""")

# Update handleSave
content = content.replace("components,", "components,\n        scrapItems,")
content = content.replace("setComponents([]);", "setComponents([]);\n        setScrapItems([]);")

# Add UI for scrap items below components UI
ui_scrap = """
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">By-Products / Scrap</label>
                    <button onClick={handleAddScrap} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">+ Add Scrap Item</button>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Item</th>
                          <th className="p-2 w-24">Qty</th>
                          <th className="p-2 w-24">Recovery Value</th>
                          <th className="p-2 w-24">Total Value</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {scrapItems.map((comp, idx) => (
                          <tr key={idx}>
                            <td className="p-2">
                              <select value={comp.productId} onChange={e => updateScrap(idx, 'productId', e.target.value)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded">
                                <option value="">Select Material</option>
                                {products.map(p => (
                                  <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input type="number" min="0.01" step="0.01" value={comp.quantity} onChange={e => updateScrap(idx, 'quantity', Number(e.target.value))} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                            </td>
                            <td className="p-2">
                              <input type="number" min="0" value={comp.recoveryCostPerUnit} onChange={e => updateScrap(idx, 'recoveryCostPerUnit', Number(e.target.value))} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" />
                            </td>
                            <td className="p-2 text-slate-700 font-medium text-right">
                              ₹{comp.totalRecoveryValue.toFixed(2)}
                            </td>
                            <td className="p-2">
                              <button onClick={() => removeScrap(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {scrapItems.length === 0 && <div className="text-center text-sm text-slate-500 py-4">No scrap added.</div>}
                  </div>
                </div>

"""

content = content.replace("</div>\n\n              </div>\n\n              {/* Footer Costs */}", ui_scrap + "\n              </div>\n\n              {/* Footer Costs */}")

with open('d:/ERP WEBSITE/erp-frontend/app/dashboard/manufacturing/bom/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
