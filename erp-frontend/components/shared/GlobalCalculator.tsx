'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Settings, Calculator, Scale, Save } from 'lucide-react';
import { evaluateExpression, units, UnitCategory, convertUnit } from '@/lib/calculator-utils';

export default function GlobalCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'units' | 'settings'>('calc');
  
  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const calcRef = useRef<HTMLDivElement>(null);

  // Shortcut State
  const [shortcutKey, setShortcutKey] = useState('Alt+c');
  const [tempShortcut, setTempShortcut] = useState('Alt+c');

  // Calculator State
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  // Unit Converter State
  const [unitCategory, setUnitCategory] = useState<UnitCategory>('Length');
  const [fromUnit, setFromUnit] = useState(units['Length'][0].id);
  const [toUnit, setToUnit] = useState(units['Length'][1].id);
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  // Load shortcut from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('erp_calculator_shortcut');
    if (saved) {
      setShortcutKey(saved);
      setTempShortcut(saved);
    }
    // Set initial position more safely after mount
    setPosition({ x: Math.max(0, window.innerWidth - 350), y: Math.max(0, window.innerHeight / 2 - 250) });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Parse shortcut like 'Alt+c' or 'Ctrl+Shift+c'
      const keys = shortcutKey.toLowerCase().split('+');
      const requiresAlt = keys.includes('alt');
      const requiresCtrl = keys.includes('ctrl');
      const requiresShift = keys.includes('shift');
      const mainKey = keys[keys.length - 1];

      if (
        (requiresAlt ? e.altKey : !e.altKey) &&
        (requiresCtrl ? e.ctrlKey : !e.ctrlKey) &&
        (requiresShift ? e.shiftKey : !e.shiftKey) &&
        e.key.toLowerCase() === mainKey
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey]);

  // Global event listener for manual toggles from elsewhere
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggle-calculator', handleToggle as EventListener);
    return () => window.removeEventListener('toggle-calculator', handleToggle as EventListener);
  }, []);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(0, Math.min(e.clientX - dragStartPos.current.x, window.innerWidth - (calcRef.current?.offsetWidth || 300))),
      y: Math.max(0, Math.min(e.clientY - dragStartPos.current.y, window.innerHeight - (calcRef.current?.offsetHeight || 400)))
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // --- Calculator Logic ---
  const inputDigit = (digit: string) => {
    if (waitingForNewValue) {
      setDisplayValue(digit);
      setWaitingForNewValue(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplayValue('0.');
      setWaitingForNewValue(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const clear = () => {
    setDisplayValue('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (previousValue == null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = evaluateExpression(previousValue, inputValue, operator);
      setDisplayValue(String(result));
      setPreviousValue(result);
    }

    setWaitingForNewValue(true);
    setOperator(nextOperator);
  };

  const calculateGst = (rate: number, isAddition: boolean) => {
    const current = parseFloat(displayValue);
    if (isNaN(current)) return;

    let result;
    if (isAddition) {
      result = current + (current * rate) / 100;
    } else {
      // Reverse GST calculation: e.g. amount is 118, rate is 18%, actual was 100
      result = current / (1 + rate / 100);
    }
    setDisplayValue(result.toFixed(2));
    setWaitingForNewValue(true);
  };

  const handleMemory = (type: 'M+' | 'M-' | 'MR' | 'MC') => {
    const current = parseFloat(displayValue);
    switch (type) {
      case 'M+':
        setMemory(memory + current);
        setWaitingForNewValue(true);
        break;
      case 'M-':
        setMemory(memory - current);
        setWaitingForNewValue(true);
        break;
      case 'MR':
        setDisplayValue(String(memory));
        setWaitingForNewValue(true);
        break;
      case 'MC':
        setMemory(0);
        break;
    }
  };

  // --- Unit Converter Logic ---
  useEffect(() => {
    if (fromValue && fromUnit && toUnit) {
      const result = convertUnit(parseFloat(fromValue), fromUnit, toUnit, unitCategory);
      setToValue(result !== null ? String(result.toPrecision(6)).replace(/\.?0+$/, '') : '');
    } else {
      setToValue('');
    }
  }, [fromValue, fromUnit, toUnit, unitCategory]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value as UnitCategory;
    setUnitCategory(cat);
    setFromUnit(units[cat][0].id);
    setToUnit(units[cat][1].id);
    setFromValue('');
    setToValue('');
  };

  if (!isOpen) return null;

  return (
    <div
      ref={calcRef}
      style={{ left: position.x, top: position.y }}
      className="fixed z-[9999] w-[320px] bg-[#222222] rounded-lg shadow-2xl border border-gray-700 font-sans select-none"
    >
      {/* Header / Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between p-3 border-b border-gray-700 bg-[#1a1a1a] rounded-t-lg cursor-move"
      >
        <div className="flex items-center space-x-2 text-gray-300">
          <Calculator size={18} />
          <span className="font-semibold text-sm tracking-wide">CITIZEN</span>
        </div>
        <div className="flex space-x-2 no-drag">
          <button onClick={() => setActiveTab('calc')} className={`p-1 rounded ${activeTab === 'calc' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`} title="Calculator">
            <Calculator size={16} />
          </button>
          <button onClick={() => setActiveTab('units')} className={`p-1 rounded ${activeTab === 'units' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`} title="Unit Converter">
            <Scale size={16} />
          </button>
          <button onClick={() => setActiveTab('settings')} className={`p-1 rounded ${activeTab === 'settings' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`} title="Settings">
            <Settings size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 rounded text-gray-500 hover:text-red-500 hover:bg-red-500/10" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 bg-[#2b2b2b] rounded-b-lg no-drag">
        {activeTab === 'calc' && (
          <div className="space-y-4">
            {/* Screen */}
            <div className="bg-[#9ea792] p-3 rounded shadow-inner border-[3px] border-[#8a927f]">
              <div className="text-right text-[#222222] font-mono text-3xl overflow-hidden text-ellipsis whitespace-nowrap min-h-[40px]">
                {displayValue}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-[#222222] opacity-70 font-mono font-bold">
                <span>{memory !== 0 ? 'M' : ''}</span>
                <span>{operator || ''}</span>
              </div>
            </div>

            {/* GST Buttons row */}
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => calculateGst(5, true)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded py-1.5 text-xs font-bold transition-colors">+5%</button>
              <button onClick={() => calculateGst(12, true)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded py-1.5 text-xs font-bold transition-colors">+12%</button>
              <button onClick={() => calculateGst(18, true)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded py-1.5 text-xs font-bold transition-colors">+18%</button>
              <button onClick={() => calculateGst(28, true)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded py-1.5 text-xs font-bold transition-colors">+28%</button>
              
              <button onClick={() => calculateGst(5, false)} className="bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded py-1.5 text-xs font-bold transition-colors">-5%</button>
              <button onClick={() => calculateGst(12, false)} className="bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded py-1.5 text-xs font-bold transition-colors">-12%</button>
              <button onClick={() => calculateGst(18, false)} className="bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded py-1.5 text-xs font-bold transition-colors">-18%</button>
              <button onClick={() => calculateGst(28, false)} className="bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded py-1.5 text-xs font-bold transition-colors">-28%</button>
            </div>

            {/* Main Keypad */}
            <div className="grid grid-cols-4 gap-2">
              {/* Memory */}
              <button onClick={() => handleMemory('MC')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">MC</button>
              <button onClick={() => handleMemory('MR')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">MR</button>
              <button onClick={() => handleMemory('M-')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">M-</button>
              <button onClick={() => handleMemory('M+')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">M+</button>

              <button onClick={() => clear()} className="bg-red-600 text-white hover:bg-red-700 rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">C</button>
              <button onClick={() => performOperation('%')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">%</button>
              <button onClick={() => {
                const val = parseFloat(displayValue);
                if (val >= 0) {
                  setDisplayValue(String(Math.sqrt(val)));
                  setWaitingForNewValue(true);
                }
              }} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">√</button>
              <button onClick={() => performOperation('/')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">÷</button>

              <button onClick={() => inputDigit('7')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">7</button>
              <button onClick={() => inputDigit('8')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">8</button>
              <button onClick={() => inputDigit('9')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">9</button>
              <button onClick={() => performOperation('*')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">×</button>

              <button onClick={() => inputDigit('4')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">4</button>
              <button onClick={() => inputDigit('5')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">5</button>
              <button onClick={() => inputDigit('6')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">6</button>
              <button onClick={() => performOperation('-')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px]">-</button>

              <button onClick={() => inputDigit('1')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">1</button>
              <button onClick={() => inputDigit('2')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">2</button>
              <button onClick={() => inputDigit('3')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">3</button>
              <button onClick={() => performOperation('+')} className="bg-[#444] text-white hover:bg-[#555] rounded py-3 text-sm font-bold shadow-sm active:translate-y-[1px] h-full" style={{ gridRow: 'span 2' }}>+</button>

              <button onClick={() => inputDigit('0')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">0</button>
              <button onClick={() => inputDigit('00')} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">00</button>
              <button onClick={() => inputDecimal()} className="bg-[#eee] text-[#222] hover:bg-white rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px]">.</button>
              
              <button onClick={() => performOperation('=')} className="bg-green-600 text-white hover:bg-green-700 rounded py-3 text-lg font-bold shadow-sm active:translate-y-[1px] col-span-4 mt-2">=</button>
            </div>
          </div>
        )}

        {activeTab === 'units' && (
          <div className="space-y-4 text-white p-2">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
              <select 
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-green-500"
                value={unitCategory}
                onChange={handleCategoryChange}
              >
                {Object.keys(units).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">From</label>
                <select 
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-green-500 mb-2"
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                >
                  {units[unitCategory].map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <input 
                  type="number"
                  placeholder="0"
                  value={fromValue}
                  onChange={(e) => setFromValue(e.target.value)}
                  className="w-full bg-[#333] border border-gray-600 rounded p-2 text-right focus:outline-none focus:border-green-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">To</label>
                <select 
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-green-500 mb-2"
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                >
                  {units[unitCategory].map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <input 
                  type="text"
                  readOnly
                  placeholder="0"
                  value={toValue}
                  className="w-full bg-[#222] border border-gray-600 rounded p-2 text-right focus:outline-none font-mono text-green-400"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 text-white p-2">
            <h3 className="font-semibold border-b border-gray-700 pb-2 mb-4">Calculator Settings</h3>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Keyboard Shortcut</label>
              <div className="flex space-x-2">
                <input 
                  type="text"
                  value={tempShortcut}
                  onChange={(e) => setTempShortcut(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="e.g. Alt+c, Ctrl+Shift+x"
                />
                <button 
                  onClick={() => {
                    setShortcutKey(tempShortcut);
                    localStorage.setItem('erp_calculator_shortcut', tempShortcut);
                    // Show a quick visual feedback or just close settings
                    setActiveTab('calc');
                  }}
                  className="bg-green-600 hover:bg-green-700 p-2 rounded text-white"
                  title="Save Shortcut"
                >
                  <Save size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tip: Use combinations like <code>Alt+c</code>, <code>Ctrl+m</code>. Refresh might be required for complex bindings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
