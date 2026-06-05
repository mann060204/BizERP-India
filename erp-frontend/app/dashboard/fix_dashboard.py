import re

file_path = "d:/ERP WEBSITE/erp-frontend/app/dashboard/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# I need to fix the broken QUICK_ACTIONS button from lines 580 to 590
# Let's replace the whole block

replacement = """<div key={label}
                draggable
                onDragStart={(e) => (dragItem.current = index)}
                onDragEnter={(e) => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                className="w-full">
                { (actions[index] as any).action ? (
                  <button onClick={() => {
                    if ((actions[index] as any).action === 'PAY_IN') setPaymentModalMode('IN');
                    else if ((actions[index] as any).action === 'PAY_OUT') setPaymentModalMode('OUT');
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group cursor-grab active:cursor-grabbing">
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0 pointer-events-none">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition">{label}</p>
                      <p className="text-xs text-slate-500 truncate font-medium mt-0.5">{desc}</p>
                    </div>
                    <div className="ml-auto flex items-center text-slate-300 group-hover:text-indigo-400 transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ) : (
                  <Link href={href as string} className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group cursor-grab active:cursor-grabbing">
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0 pointer-events-none">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition">{label}</p>
                      <p className="text-xs text-slate-500 truncate font-medium mt-0.5">{desc}</p>
                    </div>
                    <div className="ml-auto flex items-center text-slate-300 group-hover:text-indigo-400 transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                )}
              </div>"""

# Find the broken div
pattern = r'<div key=\{label\}[\s\S]*?onDragOver=\{\(e\) => e\.preventDefault\(\)\}[\s\S]*?className="w-full">[\s\S]*?</button>[\s\S]*?</div>'

new_text = re.sub(pattern, replacement, text)

# Add import Link from 'next/link'; if missing
if "import Link from 'next/link';" not in new_text and "import Link from \"next/link\";" not in new_text:
    new_text = new_text.replace("import { useRouter } from 'next/navigation';", "import { useRouter } from 'next/navigation';\nimport Link from 'next/link';")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_text)

print("Done")
