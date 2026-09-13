// src/components/CustomSelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, X } from 'lucide-react';
import { CATEGORY_COLORS as DEFAULT_CATEGORY_COLORS, FALLBACK_COLOR } from '../utils/transactionMeta';

/* ---------- Dropdown custom (pengganti <select> polos) ---------- */
// Tambahan dari versi sebelumnya:
// - prop `categoryColors` (opsional): map warna dinamis, termasuk kategori custom.
//   Kalau tidak dikasih, fallback ke CATEGORY_COLORS statis (biar tetap kompatibel
//   di tempat lain yang masih pakai cara lama).
// - prop `onAddNew` (opsional): kalau diisi function, dropdown akan menampilkan
//   opsi "+ Tambah kategori baru" di paling bawah.
// - prop `onDeleteOption` (opsional): kalau diisi function, tiap opsi dapat ikon "x"
//   kecil buat dihapus/disembunyikan (dipakai untuk kategori, termasuk yang default).
export function CustomSelect({ value, onChange, options, label, colored, categoryColors, onAddNew, onDeleteOption }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const colors = categoryColors || DEFAULT_CATEGORY_COLORS;

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setAdding(false);
        setNewValue('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const selected = options.find(o => o.value === value);

  function handleAddNew() {
    const trimmed = newValue.trim();
    if (!trimmed || !onAddNew) return;
    onAddNew(trimmed);
    onChange(trimmed);
    setAdding(false);
    setNewValue('');
    setOpen(false);
  }

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
              style={{ backgroundColor: colors[selected?.value] || FALLBACK_COLOR }}
            />
          )}
          {selected?.label || value}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-100 rounded-2xl shadow-lg py-1.5 max-h-64 overflow-auto">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition group ${
                opt.value === value ? 'text-emerald-700 bg-emerald-50/60' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="flex items-center gap-2 flex-1 text-left min-w-0"
              >
                {colored && (
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: colors[opt.value] || FALLBACK_COLOR }}
                  />
                )}
                <span className="truncate">{opt.label}</span>
              </button>
              <span className="flex items-center gap-1.5 shrink-0 pl-1.5">
                {opt.value === value && <Check size={14} className="text-emerald-600" />}
                {onDeleteOption && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Hapus kategori "${opt.label}" dari daftar?`)) {
                        onDeleteOption(opt.value);
                      }
                    }}
                    className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                    title="Hapus dari daftar"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            </div>
          ))}

          {onAddNew && (
            <div className="border-t border-slate-100 mt-1 pt-1 px-2">
              {adding ? (
                <div className="flex items-center gap-1.5 py-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
                      if (e.key === 'Escape') { setAdding(false); setNewValue(''); }
                    }}
                    placeholder="Nama kategori baru"
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition"
                  >
                    Tambah
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="w-full flex items-center gap-1.5 px-1.5 py-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50/60 rounded-lg transition"
                >
                  <Plus size={13} /> Tambah kategori baru
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}