/**
 * Sidebar.tsx — with keyboard navigation
 * ─────────────────────────────────────────────────────────────────────────────
 * Keyboard mappings (WAI-ARIA menubar / tree pattern):
 *   Arrow Down / Up   → move between top-level nav items (roving tabindex)
 *   Arrow Right       → expand submenu (if has sub-items); focus first sub-item
 *   Arrow Left        → collapse expanded submenu; return to parent
 *   Enter             → navigate to href (leaf) OR toggle submenu (parent)
 *   Escape            → collapse current submenu
 *   Sub-items:
 *     Arrow Up/Down   → move between sub-items
 *     Arrow Left / Escape → close submenu, return focus to parent
 *     Enter           → navigate to sub-item href
 */
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3, LayoutDashboard, ShoppingCart, Package, Users, Truck,
  Receipt, FileText, Wrench, Settings, LogOut, ChevronLeft, ChevronRight,
  Menu, Database, Wallet, ChevronDown, Landmark, Factory, Zap
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';

const VERSION = 'v 2.7.0';

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Sales',       href: '#',                    icon: ShoppingCart,
    subItems: [
      { label: 'Sales Invoices',        href: '/dashboard/sales' },
      { label: 'Quotations',            href: '/dashboard/quotations' },
      { label: 'Credit Notes (Returns)', href: '/dashboard/sales/returns' },
    ]
  },
  { label: 'Purchases',   href: '#',                    icon: Package,
    subItems: [
      { label: 'Purchase Bills',        href: '/dashboard/purchases' },
      { label: 'Purchase Orders',       href: '/dashboard/purchases/orders' },
      { label: 'Debit Notes (Returns)', href: '/dashboard/purchases/returns' },
    ]
  },
  { label: 'Inventory',   href: '#',                    icon: Database,
    subItems: [
      { label: 'Stock Levels',     href: '/dashboard/inventory' },
      { label: 'Batch Numbers',    href: '/dashboard/inventory/batches' },
    ]
  },
  { label: 'Manufacturing', href: '#',                  icon: Factory,
    subItems: [
      { label: 'Bill of Materials',    href: '/dashboard/manufacturing/bom' },
      { label: 'Production Orders',    href: '/dashboard/manufacturing/orders' },
    ]
  },
  { label: 'Accounts',    href: '/dashboard/accounts',  icon: Landmark,
    subItems: [
      { label: 'Cash Account',    href: '/dashboard/accounts/Cash' },
      { label: 'Bank Account',    href: '/dashboard/accounts/Bank' },
      { label: 'Loan Account',    href: '/dashboard/accounts/Loan' },
      { label: 'Asset Account',   href: '/dashboard/accounts/Asset' },
      { label: 'Capital Account', href: '/dashboard/accounts/Capital' },
      { label: 'Other Income',    href: '/dashboard/accounts/Income' },
      { label: 'Tax Payment',     href: '/dashboard/accounts/Tax' },
      { label: '⇄ Cash ↔ Bank Transfer', href: '/dashboard/accounts/transfer' },
      { label: '💳 Payment Modes', href: '/dashboard/settings/payment-modes' },
      { label: '📒 Cash & Bank Ledger', href: '/dashboard/reports/ledger' },
    ]
  },
  { label: 'Customers',   href: '/dashboard/customers', icon: Users },
  { label: 'Suppliers',   href: '/dashboard/suppliers', icon: Truck },
  { label: 'Expenses',    href: '/dashboard/expenses',  icon: Receipt },
  { label: 'Reports',     href: '/dashboard/reports',   icon: FileText },
  { label: 'Tools',       href: '/dashboard/tools',     icon: Wrench },
  { label: 'Master',      href: '/dashboard/masters',   icon: Package },
  { label: 'Settings',    href: '/dashboard/settings',  icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }: { collapsed?: boolean, setCollapsed?: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;
  const toggleCollapsed = () => setCollapsed ? setCollapsed(!isCollapsed) : setInternalCollapsed(!isCollapsed);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Roving tabindex state for keyboard navigation
  const navRef = useRef<HTMLElement>(null);
  const [focusedIdx, setFocusedIdx] = useState(-1);

  // Auto-expand the active parent menu on load
  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.subItems?.some(sub => pathname.startsWith(sub.href))) {
        setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const toggleSubmenu = (label: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (isCollapsed) toggleCollapsed();
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const expandSubmenu = useCallback((label: string) => {
    if (isCollapsed) toggleCollapsed();
    setExpandedMenus(prev => ({ ...prev, [label]: true }));
  }, [isCollapsed]);

  const collapseSubmenu = useCallback((label: string) => {
    setExpandedMenus(prev => ({ ...prev, [label]: false }));
  }, []);

  // ─── Keyboard handler for top-level nav items ──────────────────────────────
  const handleNavKeyDown = useCallback((e: React.KeyboardEvent, itemIdx: number) => {
    const item = NAV_ITEMS[itemIdx];
    const navEl = navRef.current;
    if (!navEl) return;

    // Get all top-level nav link elements
    const topLinks = Array.from(
      navEl.querySelectorAll<HTMLElement>('[data-nav-toplevel]')
    );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        {
          const nextIdx = (itemIdx + 1) % NAV_ITEMS.length;
          setFocusedIdx(nextIdx);
          topLinks[nextIdx]?.focus();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        {
          const prevIdx = (itemIdx - 1 + NAV_ITEMS.length) % NAV_ITEMS.length;
          setFocusedIdx(prevIdx);
          topLinks[prevIdx]?.focus();
        }
        break;

      case 'ArrowRight':
      case 'Enter':
        e.preventDefault();
        if (item.subItems) {
          expandSubmenu(item.label);
          // Focus first sub-item after expanding
          setTimeout(() => {
            const subLinks = navEl.querySelectorAll<HTMLElement>(`[data-nav-sub="${item.label}"]`);
            subLinks[0]?.focus();
          }, 60);
        } else if (e.key === 'Enter') {
          router.push(item.href);
          setMobileOpen(false);
        }
        break;

      case 'ArrowLeft':
      case 'Escape':
        e.preventDefault();
        if (item.subItems && expandedMenus[item.label]) {
          collapseSubmenu(item.label);
        }
        break;

      case 'Home':
        e.preventDefault();
        setFocusedIdx(0);
        topLinks[0]?.focus();
        break;

      case 'End':
        e.preventDefault();
        setFocusedIdx(NAV_ITEMS.length - 1);
        topLinks[NAV_ITEMS.length - 1]?.focus();
        break;
    }
  }, [expandedMenus, expandSubmenu, collapseSubmenu, router]);

  // ─── Keyboard handler for sub-items ───────────────────────────────────────
  const handleSubKeyDown = useCallback((
    e: React.KeyboardEvent,
    parentLabel: string,
    subIdx: number,
    subItems: { label: string; href: string }[]
  ) => {
    const navEl = navRef.current;
    if (!navEl) return;
    const subLinks = Array.from(
      navEl.querySelectorAll<HTMLElement>(`[data-nav-sub="${parentLabel}"]`)
    );
    const parentLinks = Array.from(
      navEl.querySelectorAll<HTMLElement>('[data-nav-toplevel]')
    );
    const parentIdx = NAV_ITEMS.findIndex(i => i.label === parentLabel);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        subLinks[Math.min(subIdx + 1, subLinks.length - 1)]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (subIdx === 0) {
          // Return focus to parent
          parentLinks[parentIdx]?.focus();
        } else {
          subLinks[subIdx - 1]?.focus();
        }
        break;
      case 'ArrowLeft':
      case 'Escape':
        e.preventDefault();
        collapseSubmenu(parentLabel);
        parentLinks[parentIdx]?.focus();
        break;
      case 'Enter':
        // Allow navigation naturally — sub-items are real <Link> elements
        break;
    }
  }, [collapseSubmenu]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className={`sidebar-logo-area flex items-center gap-3 px-4 py-4 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="sidebar-logo-badge w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" onError={(e: any) => { e.target.style.display='none'; }} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-white font-bold text-base tracking-tight leading-tight">BizERP</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--sidebar-text)' }}>India</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
        aria-label="Main navigation"
        role="menubar"
        aria-orientation="vertical"
      >
        {NAV_ITEMS.map((item, itemIdx) => {
          const { label, href, icon: Icon, subItems } = item;
          const isParentActive = subItems?.some(sub => pathname.startsWith(sub.href));
          const active = isActive(href) || (!!isParentActive && !subItems);
          const expanded = expandedMenus[label];

          return (
            <div key={label} data-nav-parent={label}>
              <Link
                href={subItems ? '#' : href}
                prefetch={false}
                role="menuitem"
                aria-haspopup={!!subItems}
                aria-expanded={subItems ? expanded : undefined}
                tabIndex={focusedIdx === itemIdx ? 0 : focusedIdx === -1 && itemIdx === 0 ? 0 : -1}
                data-nav-toplevel
                onClick={(e) => {
                  if (subItems) toggleSubmenu(label, e);
                  else setMobileOpen(false);
                }}
                onKeyDown={(e) => handleNavKeyDown(e, itemIdx)}
                className={`sidebar-nav-link flex items-center justify-between px-3 py-2.5 rounded-xl group
                  ${(active && !subItems) || isParentActive ? 'active' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '18px', height: '18px', opacity: (active && !subItems) || isParentActive ? 1 : 0.7 }} />
                  {!isCollapsed && (
                    <span className="text-[13px] font-medium">{label}</span>
                  )}
                </div>
                {!isCollapsed && subItems && (
                  <ChevronDown
                    style={{ width: '14px', height: '14px', opacity: 0.6 }}
                    className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                  />
                )}
              </Link>

              {/* Sub-menu */}
              {!isCollapsed && subItems && expanded && (
                <div className="mt-0.5 ml-3 pl-4 border-l space-y-0.5 py-1" style={{ borderColor: 'var(--sidebar-border)' }} role="menu">
                  {subItems.map((sub, subIdx) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      prefetch={false}
                      role="menuitem"
                      tabIndex={0}
                      data-nav-sub={label}
                      onClick={() => setMobileOpen(false)}
                      onKeyDown={(e) => handleSubKeyDown(e, label, subIdx, subItems)}
                      className={`sidebar-sub-link block px-3 py-2 rounded-lg text-[12px] font-medium transition-all
                        ${pathname === sub.href ? 'active' : ''}`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <Zap style={{ width: '12px', height: '12px', color: '#fbbf24' }} />
                <span className="text-[10px] font-bold" style={{ color: 'var(--sidebar-text)' }}>{VERSION}</span>
              </div>
            </div>
            <p className="text-[9px] text-center" style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
              © {new Date().getFullYear()} Ozen Studio · Built by Mann Monapra
            </p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-[9px] font-bold" style={{ color: 'var(--sidebar-text)', opacity: 0.6 }}>v2</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`sidebar-root hidden lg:flex flex-col fixed left-0 top-0 h-full transition-all duration-300 z-40
          ${isCollapsed ? 'w-[64px]' : 'w-[220px]'}`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center text-white border shadow-lg transition-all hover:scale-110"
          style={{ background: 'var(--sidebar-active-bg)', borderColor: 'var(--sidebar-border)' }}
        >
          {isCollapsed
            ? <ChevronRight style={{ width: '12px', height: '12px' }} />
            : <ChevronLeft style={{ width: '12px', height: '12px' }} />}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar-root relative w-[220px] h-full shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-xl text-white shadow-lg"
        style={{ background: 'var(--sidebar-active-bg)' }}
        aria-label="Open navigation menu"
        onClick={() => setMobileOpen(true)}
      >
        <Menu style={{ width: '18px', height: '18px' }} />
      </button>
    </>
  );
}
