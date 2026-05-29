'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, LayoutDashboard, ShoppingCart, Package, Users, Truck,
  Receipt, FileText, Wrench, Settings, LogOut, ChevronLeft, ChevronRight,
  Menu, Database,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';

const NAV_ITEMS = [
  { label: 'Dashboard',       href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Sales',           href: '/dashboard/sales',    icon: ShoppingCart },
  { label: 'Quotations',      href: '/dashboard/quotations', icon: FileText },
  { label: 'Purchases',       href: '/dashboard/purchases',icon: Package },
  { label: 'Inventory',       href: '/dashboard/inventory',icon: Database },
  { label: 'Customers',       href: '/dashboard/customers',icon: Users },
  { label: 'Suppliers',       href: '/dashboard/suppliers',icon: Truck },
  { label: 'Expenses',        href: '/dashboard/expenses', icon: Receipt },
  { label: 'Reports',         href: '/dashboard/reports',  icon: FileText },
  { label: 'Tools',           href: '/dashboard/tools',    icon: Wrench },
  { label: 'Master',          href: '/dashboard/masters',  icon: Package },
  { label: 'Settings',        href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-200 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        {!collapsed && <span className="text-slate-900 font-bold text-base tracking-tight">Bissness</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${isActive(href)
                ? 'bg-action-50 text-action-600 border border-blue-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'}`}>
            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive(href) ? 'text-action-500' : ''}`} />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-200">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-slate-900 text-sm font-semibold truncate">{user?.name || 'Admin'}</p>
            <p className="text-slate-600 text-xs capitalize">{user?.role}</p>
          </div>
        )}
        <button onClick={() => dispatch(logout())}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-900/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-40
        ${collapsed ? 'w-[68px]' : 'w-60'}`}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Mobile menu button (inside topbar — exported via context, or just repeat) */}
      <button className="lg:hidden fixed top-3.5 left-4 z-40 p-2 rounded-lg bg-white border border-slate-200 text-slate-600"
        onClick={() => setMobileOpen(true)}>
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
