/**
 * useKeyboardNav.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized keyboard navigation primitives for the ERP application.
 *
 * KEY MAPPINGS (standard across all screens):
 * ┌──────────────┬────────────────────────────────────────────────────────────┐
 * │ Key          │ Effect                                                     │
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Arrow Up/Down│ Move selection in lists, menus, table rows                 │
 * │ Arrow Right  │ Expand submenu / move to next column                       │
 * │ Arrow Left   │ Collapse submenu / move to previous column                 │
 * │ Enter        │ Confirm selection / open row / advance form field          │
 * │ Escape       │ Close modal/dropdown / collapse submenu                    │
 * │ Home/End     │ Jump to first/last row in a table                          │
 * │ Page Up/Down │ Jump by PAGE_SIZE rows in a table                          │
 * │ Tab          │ Standard browser behavior (never overridden in text inputs) │
 * │ Ctrl+S       │ Save current form (prevent browser save dialog)            │
 * │ Ctrl+K or /  │ Focus global search bar                                    │
 * └──────────────┴────────────────────────────────────────────────────────────┘
 *
 * SAFETY RULE: Arrow keys are NEVER intercepted when focus is inside a
 * <input type="text">, <input type="number">, or <textarea>. Only intercepted
 * on rows, menu items, buttons, and other non-text-editing elements.
 *
 * HOW TO ADOPT IN A NEW SCREEN:
 *   1. Roving list/table:  useRovingIndex(items.length, containerRef, onActivate)
 *   2. Modal focus trap:   useFocusTrap(modalRef, isOpen, onClose)
 *   3. Enter-to-next form: add data-nav-field to inputs + useEnterToNext(formRef)
 *   4. Global shortcuts:   useGlobalShortcuts({ onSave, onSearch })
 */

'use client';
import { useEffect, useCallback, useRef, RefObject } from 'react';

const PAGE_SIZE = 10;

/** Returns true when the event target is a text-input element (cursor keys should not be hijacked) */
function isTextInput(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea') return true;
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type.toLowerCase();
    // Only intercept arrow keys when NOT in a text/number/search/email field
    return ['text', 'number', 'search', 'email', 'tel', 'url', 'password'].includes(type);
  }
  return false;
}

// ─── 1. Roving Index (for Tables and Menus) ────────────────────────────────

/**
 * Manages Up/Down/Home/End/PageUp/PageDown focus within a list or table.
 * Use the `data-nav-row` attribute on each focusable row/item element.
 *
 * @param count      Total number of items
 * @param containerRef  Ref to the scrollable container holding the rows
 * @param onActivate Callback when Enter is pressed on a focused item (receives index)
 * @param enabled    Set false to temporarily disable (e.g. when a modal is open)
 * @returns          { focusedIndex, setFocusedIndex, handleKeyDown }
 */
export function useRovingIndex(
  count: number,
  containerRef: RefObject<HTMLElement | null>,
  onActivate: (index: number) => void,
  enabled = true
) {
  const focusedIndexRef = useRef(-1);

  const focus = useCallback((nextIdx: number) => {
    if (!containerRef.current) return;
    const rows = containerRef.current.querySelectorAll<HTMLElement>('[data-nav-row]');
    if (!rows.length) return;
    const clamped = Math.max(0, Math.min(nextIdx, rows.length - 1));
    focusedIndexRef.current = clamped;

    // Remove tabIndex=0 from all, give it only to the active one (roving tabindex)
    rows.forEach((r, i) => {
      r.setAttribute('tabindex', i === clamped ? '0' : '-1');
      r.setAttribute('aria-selected', i === clamped ? 'true' : 'false');
    });
    rows[clamped].focus({ preventScroll: false });
    rows[clamped].scrollIntoView({ block: 'nearest' });
  }, [containerRef]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || isTextInput(e.target)) return;
    const rows = containerRef.current?.querySelectorAll<HTMLElement>('[data-nav-row]');
    if (!rows?.length) return;

    const current = focusedIndexRef.current;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focus(current < 0 ? 0 : Math.min(current + 1, rows.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        focus(current < 0 ? rows.length - 1 : Math.max(current - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        focus(0);
        break;
      case 'End':
        e.preventDefault();
        focus(rows.length - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        focus(Math.min((current < 0 ? 0 : current) + PAGE_SIZE, rows.length - 1));
        break;
      case 'PageUp':
        e.preventDefault();
        focus(Math.max((current < 0 ? 0 : current) - PAGE_SIZE, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (current >= 0) onActivate(current);
        break;
    }
  }, [enabled, containerRef, focus, onActivate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, handleKeyDown]);

  // Reset when content changes
  useEffect(() => {
    focusedIndexRef.current = -1;
  }, [count]);

  return { focus };
}

// ─── 2. Focus Trap (for Modals) ────────────────────────────────────────────

/**
 * Traps Tab/Shift+Tab inside the modal and closes on Escape.
 * Restores focus to the element that was focused before the modal opened.
 *
 * @param modalRef   Ref to the modal container element
 * @param isOpen     Whether the modal is currently open
 * @param onClose    Callback to close the modal (called on Escape)
 */
export function useFocusTrap(
  modalRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void
) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save what had focus before the modal opened
    triggerRef.current = document.activeElement as HTMLElement;

    const FOCUSABLE = [
      'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
      'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function getFocusable() {
      return Array.from(modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    }

    // Auto-focus the first focusable element in the modal
    const focusables = getFocusable();
    if (focusables.length) {
      setTimeout(() => focusables[0].focus(), 50);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, modalRef, onClose]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      setTimeout(() => triggerRef.current?.focus(), 50);
    }
  }, [isOpen]);
}

// ─── 3. Enter-to-Next Form Field ────────────────────────────────────────────

/**
 * Makes Enter advance to the next field in a form (Tally-style).
 * Mark each field with data-nav-field attribute.
 * Enter on the LAST data-nav-field submits (calls onSubmit).
 *
 * @param formRef   Ref to the <form> or container element
 * @param onSubmit  Optional callback for Enter on the last field
 */
export function useEnterToNext(
  formRef: RefObject<HTMLElement | null>,
  onSubmit?: () => void
) {
  useEffect(() => {
    const container = formRef.current;
    if (!container) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      // Don't intercept Enter in textarea or submit buttons
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLButtonElement) return;

      const fields = Array.from(
        container.querySelectorAll<HTMLElement>('[data-nav-field]')
      ).filter(el => !el.hasAttribute('disabled'));

      const currentIndex = fields.indexOf(e.target as HTMLElement);
      if (currentIndex < 0) return;

      e.preventDefault();
      if (currentIndex < fields.length - 1) {
        fields[currentIndex + 1].focus();
        // Select text in inputs for quick overwrite
        if (fields[currentIndex + 1] instanceof HTMLInputElement) {
          (fields[currentIndex + 1] as HTMLInputElement).select();
        }
      } else {
        // Last field — trigger submit
        onSubmit?.();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [formRef, onSubmit]);
}

// ─── 4. Global Shortcuts ────────────────────────────────────────────────────

/**
 * Registers global keyboard shortcuts on the document.
 * Safe: Ctrl+S prevent defaults the browser Save dialog.
 *
 * @param onSave    Called on Ctrl+S (save current form)
 * @param onSearch  Called on Ctrl+K or "/" when not in a text input
 */
export function useGlobalShortcuts({
  onSave,
  onSearch,
}: {
  onSave?: () => void;
  onSearch?: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+S — save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }
      // Ctrl+K or "/" — search (only when not typing)
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !isTextInput(e.target))) {
        e.preventDefault();
        onSearch?.();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onSearch]);
}

// ─── 5. Sidebar Submenu Navigation helper ───────────────────────────────────

/**
 * Returns an onKeyDown handler for a sidebar nav item.
 * Handles Arrow Right/Enter (expand), Arrow Left/Escape (collapse).
 *
 * @param hasSubmenu     Whether this item has sub-items
 * @param isExpanded     Current expanded state
 * @param onExpand       Open/expand submenu
 * @param onCollapse     Close/collapse submenu
 * @param onNavigate     Navigate to the item's href (for leaf items)
 */
export function useSidebarItemKeyDown({
  hasSubmenu,
  isExpanded,
  onExpand,
  onCollapse,
  onNavigate,
}: {
  hasSubmenu: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onNavigate: () => void;
}) {
  return useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'Enter':
        e.preventDefault();
        if (hasSubmenu) {
          if (!isExpanded) onExpand();
          // Focus first sub-item after expanding
          setTimeout(() => {
            const sub = (e.currentTarget as HTMLElement)
              .closest('[data-nav-parent]')
              ?.querySelector<HTMLElement>('[data-nav-sub]');
            sub?.focus();
          }, 50);
        } else {
          onNavigate();
        }
        break;
      case 'ArrowLeft':
      case 'Escape':
        e.preventDefault();
        if (hasSubmenu && isExpanded) onCollapse();
        break;
    }
  }, [hasSubmenu, isExpanded, onExpand, onCollapse, onNavigate]);
}
