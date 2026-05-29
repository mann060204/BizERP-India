import * as fs from 'fs';
const file = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/masters/categories/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace imports
content = content.replace(/import \{ Loader2, Save, X, Layers, Plus, Tag, ChevronDown, ChevronRight \} from 'lucide-react';/, "import { Loader2, Save, X, Layers, Plus, Tag, ChevronDown, ChevronRight, Edit3, Check } from 'lucide-react';");

// Add state variables
const stateVars = `
  const [newGroup, setNewGroup] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [newBrandInputs, setNewBrandInputs] = useState<Record<string, string>>({});
  
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupInput, setEditGroupInput] = useState('');
  
  const [editingBrand, setEditingBrand] = useState<{group: string, idx: number} | null>(null);
  const [editBrandInput, setEditBrandInput] = useState('');
`;

content = content.replace(/const \[newGroup, setNewGroup\] = useState\(''\);\r?\n\s*const \[expandedGroup, setExpandedGroup\] = useState<string \| null>\(null\);\r?\n\s*const \[newBrandInputs, setNewBrandInputs\] = useState<Record<string, string>>\(\{\}\);/, stateVars);

// Add edit functions
const editFuncs = `
  const startEditGroup = (name: string, e: any) => {
    e.stopPropagation();
    setEditingGroup(name);
    setEditGroupInput(name);
  };
  
  const saveGroupEdit = (oldName: string, e: any) => {
    e.stopPropagation();
    const trimmed = editGroupInput.trim();
    if (!trimmed || trimmed === oldName) { setEditingGroup(null); return; }
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Group already exists'); return;
    }
    setCategories(categories.map(c => c.name === oldName ? { ...c, name: trimmed } : c));
    if (expandedGroup === oldName) setExpandedGroup(trimmed);
    setEditingGroup(null);
  };

  const startEditBrand = (group: string, idx: number, name: string) => {
    setEditingBrand({ group, idx });
    setEditBrandInput(name);
  };
  
  const saveBrandEdit = () => {
    if (!editingBrand) return;
    const trimmed = editBrandInput.trim();
    if (!trimmed) { setEditingBrand(null); return; }
    setCategories(categories.map(cat => {
      if (cat.name === editingBrand.group) {
        if (cat.brands[editingBrand.idx] === trimmed) return cat;
        if (cat.brands.some((b, i) => i !== editingBrand.idx && b.toLowerCase() === trimmed.toLowerCase())) {
          toast.error('Brand already exists in this group'); return cat;
        }
        const newBrands = [...cat.brands];
        newBrands[editingBrand.idx] = trimmed;
        return { ...cat, brands: newBrands };
      }
      return cat;
    }));
    setEditingBrand(null);
  };
`;

content = content.replace(/const removeBrand = \(groupName: string, brandIdx: number\) => \{[^}]*\}\);\r?\n\s*\};/, match => match + '\n' + editFuncs);

// Replace group rendering
const groupHeader = `
                  {/* Group Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#111111] transition group"
                    onClick={() => { if (!editingGroup) setExpandedGroup(isExpanded ? null : cat.name); }}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-[#64748b]" /> : <ChevronRight className="w-5 h-5 text-[#64748b]" />}
                      
                      {editingGroup === cat.name ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input 
                            autoFocus
                            value={editGroupInput} 
                            onChange={e => setEditGroupInput(e.target.value)} 
                            onKeyDown={e => { if (e.key === 'Enter') saveGroupEdit(cat.name, e); else if (e.key === 'Escape') setEditingGroup(null); }}
                            className="bg-[#1A1A1A] border border-indigo-500 rounded px-2 py-1 text-white text-lg font-bold focus:outline-none"
                          />
                          <button onClick={(e) => saveGroupEdit(cat.name, e)} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Check className="w-4 h-4"/></button>
                          <button onClick={() => setEditingGroup(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-white text-lg">{cat.name}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#94a3b8]">{cat.brands.length} Brands</span>
                        </>
                      )}
                    </div>
                    
                    {!editingGroup && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={(e) => startEditGroup(cat.name, e)} 
                          className="p-1.5 text-[#64748b] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition mr-1"
                          title="Edit Group"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeGroup(cat.name); }} 
                          className="p-1.5 text-[#64748b] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete Group"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
`;
content = content.replace(/\{\/\* Group Header \*\/\}[^]*?<\/button>\r?\n\s*<\/div>/, groupHeader.trim());

// Replace brand rendering
const brandMapping = `
                            {cat.brands.map((brand, idx) => {
                              const isEditing = editingBrand?.group === cat.name && editingBrand?.idx === idx;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#111111] border border-[#1A1A1A] group">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2 w-full">
                                      <input 
                                        autoFocus
                                        value={editBrandInput}
                                        onChange={e => setEditBrandInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveBrandEdit(); else if (e.key === 'Escape') setEditingBrand(null); }}
                                        className="bg-[#1A1A1A] border border-indigo-500 rounded px-2 py-1 flex-1 text-sm text-white focus:outline-none"
                                      />
                                      <button onClick={saveBrandEdit} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Check className="w-3.5 h-3.5"/></button>
                                      <button onClick={() => setEditingBrand(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X className="w-3.5 h-3.5"/></button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-sm font-medium text-[#D4D4D4]">{brand}</span>
                                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => startEditBrand(cat.name, idx, brand)} className="p-1 text-[#64748b] hover:text-indigo-400 hover:bg-indigo-500/10 rounded mr-1">
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => removeBrand(cat.name, idx)} className="p-1 text-[#64748b] hover:text-red-400 hover:bg-red-500/10 rounded">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
`;
content = content.replace(/\{cat\.brands\.map\(\(brand, idx\) => \(\r?\n\s*<div key=\{idx\}[^]*?<\/div>\r?\n\s*\)\)\}/, brandMapping.trim());

fs.writeFileSync(file, content);
console.log('Fixed categories page');
