// src/components/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Bikin daftar nomor halaman yang ditampilkan, dengan "..." kalau kepanjangan.
  // Contoh hasil: [1, '...', 4, 5, 6, '...', 12] biar gak numpuk semua angka
  // kalau datanya banyak (misal 50 halaman).
  const getPageNumbers = () => {
    const pages = [];
    const delta = 1;
    const range = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    pages.push(1);
    if (range[0] > 2) pages.push('...');
    pages.push(...range);
    if (range[range.length - 1] < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100">
      <p className="text-[11px] text-slate-400 font-semibold order-2 sm:order-1">
        Menampilkan {startItem}-{endItem} dari {totalItems} data
      </p>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400 font-bold">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition ${
                p === currentPage
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}