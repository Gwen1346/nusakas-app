// src/components/CustomSelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CATEGORY_COLORS, FALLBACK_COLOR } from '../utils/transactionMeta';

/* ---------- Dropdown custom (pengganti <select> polos) ---------- */
export function CustomSelect({ value, onChange, options, label, colored }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-[11px] font-bold text-slate-500 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-left flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          open ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/60'
        }`}
      >
        <span className="flex items-center gap-2 text-slate-700 truncate">
          {colored && (
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[selected?.value] || FALLBACK_COLOR }}
            />
          )}
          {selected?.label || value}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-100 rounded-2xl shadow-lg py-1.5 max-h-56 overflow-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-left transition ${
                opt.value === value ? 'text-emerald-700 bg-emerald-50/60' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                {colored && (
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[opt.value] || FALLBACK_COLOR }}
                  />
                )}
                {opt.label}
              </span>
              {opt.value === value && <Check size={14} className="text-emerald-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}