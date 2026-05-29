import Link from 'next/link';
import Topbar from '../../../components/layout/Topbar';
import { Package, Tag, Layers, Database, PlusCircle, Search, Settings2, HandCoins, Calendar } from 'lucide-react';

export default function MasterDashboard() {
  const masterModules = [
    {
      title: 'Items & Services',
      description: 'Manage your entire product catalog and service offerings.',
      icon: Package,
      color: 'text-blue-400',
      bg: 'bg-action-500/10',
      actions: [
        { label: 'Add Product', href: '/dashboard/masters/items?action=add-product', icon: PlusCircle },
        { label: 'Add Service', href: '/dashboard/masters/items?action=add-service', icon: PlusCircle },
        { label: 'Search & Manage', href: '/dashboard/masters/items', icon: Search },
      ]
    },
    {
      title: 'Discount Schemes',
      description: 'Setup and monitor active promotional and bulk discount rules.',
      icon: Tag,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      actions: [
        { label: 'Add Discount', href: '/dashboard/discounts/new', icon: PlusCircle },
        { label: 'Manage Schemes', href: '/dashboard/discounts', icon: Search },
      ]
    },
    {
      title: 'Category & Brand Master',
      description: 'Define your product groups and link specific brands to each group.',
      icon: Layers,
      color: 'text-blue-400',
      bg: 'bg-action-500/10',
      actions: [
        { label: 'Manage Categories', href: '/dashboard/masters/categories', icon: Database },
      ]
    },
    {
      title: 'Miscellaneous',
      description: 'Other essential configurations including units, holidays, and expense types.',
      icon: Settings2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      actions: [
        { label: 'Unit Master', href: '/dashboard/masters/units', icon: Settings2 },
        { label: 'Expense Master', href: '/dashboard/masters/expenses', icon: HandCoins },
        { label: 'Holiday Master', href: '/dashboard/masters/holidays', icon: Calendar },
        { label: 'Bank Master', href: '/dashboard/masters/banks', icon: Database },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <Topbar title="Master Dashboard" />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Master Configurations</h2>
            <p className="text-slate-600 mt-2">Centralized hub for all your core business entities and settings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masterModules.map((module, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col hover:border-[#333333] transition-colors shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.bg}`}>
                    <module.icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{module.title}</h3>
                </div>
                
                <p className="text-sm text-slate-600 mb-6 flex-1">
                  {module.description}
                </p>

                <div className="space-y-2">
                  {module.actions.map((action, aIdx) => (
                    <Link key={aIdx} href={action.href} 
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F1F5F9] border border-transparent hover:border-[#262626] hover:bg-[#E2E8F0] text-sm text-slate-900 font-medium transition group">
                      <div className="flex items-center gap-2.5 text-slate-700 group-hover:text-slate-900">
                        <action.icon className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
                        {action.label}
                      </div>
                      <span className="text-slate-600 group-hover:text-slate-900 transition-colors">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
