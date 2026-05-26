'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, LayoutDashboard, ShoppingCart, Package, Users, Truck,
  Receipt, FileText, Wrench, Settings, LogOut, ChevronLeft, ChevronRight,
  Menu, Database, ChevronDown, CircleDot,
  PlusCircle, Search, Tag, Layers, Settings2, MoreHorizontal, SunSnow, Calendar, HandCoins
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';

interface NavItem {
  label: string;
  href?: string;
  icon: any;
  subItems?: { label: string; href: string; icon?: any }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Sales',           href: '/dashboard/sales',    icon: ShoppingCart },
  { label: 'Purchases',       href: '/dashboard/purchases',icon: Package },
  { label: 'Inventory',       href: '/dashboard/inventory',icon: Database },
  { label: 'Customers',       href: '/dashboard/customers',icon: Users },
  { label: 'Suppliers',       href: '/dashboard/suppliers',icon: Truck },
  { label: 'Expenses',        href: '/dashboard/expenses', icon: Receipt },
  { label: 'Reports',         href: '/dashboard/reports',  icon: FileText },
  { label: 'Tools',           href: '/dashboard/tools',    icon: Wrench },
  { 
    label: 'Master',
    icon: Package,
    subItems: [
      { label: 'Add Product', href: '/dashboard/masters?action=add-product', icon: PlusCircle },
      { label: 'Add Service', href: '/dashboard/masters?action=add-service', icon: PlusCircle },
      { label: 'Search & Manage Item', href: '/dashboard/masters', icon: Search },
      { label: 'Add Discount', href: '/dashboard/discounts/new', icon: Tag },
      { label: 'Search & Manage Discounts', href: '/dashboard/discounts', icon: Search },
      { label: 'Brand Master', href: '/dashboard/settings?tab=masters', icon: Layers },
      { label: 'Group Master', href: '/dashboard/settings?tab=masters', icon: Layers },
      { label: 'Unit Master', href: '/dashboard/masters/units', icon: Settings2 },
      { label: 'Expense Master', href: '/dashboard/masters/expenses', icon: HandCoins },
      { label: 'Holiday Master', href: '/dashboard/masters/holidays', icon: Calendar },
    ]
  },
  { label: 'Settings',        href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('Master'); // Keep Master open by default

  const isActive = (href: string) => {
    // If navigating to masters page without actions, treat base as active
    if (href === '/dashboard/masters' && pathname === '/dashboard/masters') return true;
    return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  };

  const isSubItemActive = (href: string) => {
    // Basic prefix matching for subitems
    return pathname === href.split('?')[0]; 
  };

  const toggleAccordion = (label: string) => {
    setOpenAccordion(openAccordion === label ? null : label);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#1A1A1A] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && <span className="text-white font-bold text-base tracking-tight">BizERP India</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const { label, href, icon: Icon, subItems } = item;
          const isAccordionOpen = openAccordion === label;

          if (subItems) {
            return (
              <div key={label} className="mb-2">
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    toggleAccordion(label);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-[#94a3b8] hover:text-white hover:bg-[#111111]`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-bold tracking-wide">{label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Sub Items */}
                {isAccordionOpen && !collapsed && (
                  <div className="mt-1 ml-2 pl-4 border-l border-[#262626] space-y-0.5">
                    {subItems.map((sub, idx) => {
                      const SubIcon = sub.icon || CircleDot;
                      // Determine visual groups by adding margin before Brand Master and Unit Master
                      const isGroupStart = sub.label === 'Brand Master' || sub.label === 'Unit Master';
                      
                      return (
                        <div key={sub.href + sub.label}>
                          {isGroupStart && <div className="h-2" />}
                          <Link href={sub.href} onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200
                              ${isSubItemActive(sub.href)
                                ? 'bg-blue-500/10 text-blue-400 font-medium'
                                : 'text-[#64748b] hover:text-white hover:bg-[#111111]'}`}>
                            <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs">{sub.label}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Normal Item
          return (
            <Link key={href} href={href!} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive(href!)
                  ? 'bg-[#FFFFFF]/10 text-[#D4D4D4] border border-[#FFFFFF]/30 shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#111111] border border-transparent'}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-[#1A1A1A]">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-semibold truncate">{user?.name || 'Admin'}</p>
            <p className="text-[#94a3b8] text-xs capitalize">{user?.role}</p>
          </div>
        )}
        <button onClick={() => dispatch(logout())}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#94a3b8] hover:text-red-400 hover:bg-red-900/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-[#0A0A0A] border-r border-[#1A1A1A] transition-all duration-300 z-40
        ${collapsed ? 'w-[68px]' : 'w-64'}`}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center text-[#94a3b8] hover:text-white transition shadow-lg shadow-black">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-[#0A0A0A] h-full shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Mobile menu button (inside topbar — exported via context, or just repeat) */}
      <button className="lg:hidden fixed top-3.5 left-4 z-40 p-2 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-[#94a3b8]"
        onClick={() => setMobileOpen(true)}>
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
