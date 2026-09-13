// src/components/ScanReceiptModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, ImageUp, Loader2, Trash2, ScanLine, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../services/api'; // Sesuaikan path ini kalau lokasi api.js kamu beda

const CATEGORIES = ['Bahan Baku', 'Operasional', 'Minuman', 'Makanan', 'Lainnya'];
const TYPE_OPTIONS = [
  { value: 'EXPENSE', label: 'Pengeluaran' },
  { value: 'INCOME', label: 'Pemasukan' },
];

// Ubah File jadi base64 murni (tanpa prefix "data:image/...;base64,")
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

// Resize + kompres foto struk sebelum dikirim ke server, supaya payload kecil
// (foto HP asli bisa 3-8MB, gampang kena limit ukuran request) dan upload lebih cepat.
function compressImage(file, maxDimension = 1600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) return reject(new Error('Gagal mengompres gambar'));
          resolve(new File([blob], file.name || 'struk.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat gambar'));
    };

    img.src = objectUrl;
  });
}

const formatRupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
// Buat nampilin angka di input dengan pemisah ribuan (mis. "21.819"), tapi
// state yang disimpan tetap angka mentah murni -- sama polanya kayak input
// Nominal di TransactionTab.jsx.
const displayPrice = (n) => (n === '' || n === null || n === undefined ? '' : Number(n).toLocaleString('id-ID'));
const parsePriceInput = (value) => value.replace(/\D/g, '');

// Dropdown custom buat ganti <select> native -- <select> stylingnya (warna
// background pas hover, dll) dikendalikan browser/OS dan gak bisa di-custom
// penuh pakai Tailwind, jadi bikin sendiri biar konsisten sama desain modal.
function CustomDropdown({ value, options, onChange, buttonClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-400 ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-semibold transition ${
                opt.value === value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ScanReceiptModal({ onClose, onSaved }) {
  // step: 'upload' | 'loading' | 'review' | 'saving'
  const [step, setStep] = useState('upload');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setPreviewUrl(URL.createObjectURL(file));
    setStep('loading');

    try {
      const compressed = await compressImage(file);
      const base64 = await fileToBase64(compressed);
      const res = await api.post('/ai/scan-receipt', {
        image: base64,
        mimeType: compressed.type || 'image/jpeg',
      });

      const scanned = res.data?.data || [];
      if (scanned.length === 0) {
        setError('AI tidak menemukan item di struk ini. Coba foto ulang lebih jelas, atau input manual.');
        setStep('upload');
        return;
      }

      setItems(
        scanned.map((it, idx) => ({
          _id: `${Date.now()}-${idx}`,
          include: true,
          name: it.name,
          price: it.price,
          qty: it.qty,
          category: it.category,
          type: 'EXPENSE', // default: kebanyakan struk yang di-scan itu belanja. Bisa diganti di layar review.
        }))
      );
      setStep('review');
    } catch (err) {
      console.error('Scan receipt failed:', err);
      setError(
        err.response?.data?.message || 'Gagal memproses struk. Cek koneksi internet lalu coba lagi.'
      );
      setStep('upload');
    }
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it._id === id ? { ...it, [field]: value } : it))
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it._id !== id));
  };

  // Terapkan satu tipe transaksi ke semua item sekaligus -- berguna kalau
  // struknya ternyata rekap penjualan (Pemasukan), bukan belanja bahan baku.
  const setAllType = (type) => {
    setItems((prev) => prev.map((it) => ({ ...it, type })));
  };

  const includedItems = items.filter((it) => it.include);
  const totalIncluded = includedItems.reduce((sum, it) => sum + Number(it.price || 0), 0);

  const handleSaveAll = async () => {
    if (includedItems.length === 0) return;
    setStep('saving');
    setError('');

    const today = new Date().toISOString().split('T')[0];
    const failedNames = [];

    // Simpan satu-satu, tapi tetap lanjut ke item berikutnya kalau salah satu gagal,
    // jadi 1 item bermasalah gak bikin item lain yang valid ikut gagal kekirim.
    for (const it of includedItems) {
      try {
        await api.post('/transactions', {
          name: it.name,
          type: it.type || 'EXPENSE',
          category: it.category,
          price: Number(it.price) || 0,
          qty: Number(it.qty) || 1,
          date: today,
        });
      } catch (err) {
        console.error('Save item failed:', it.name, err);
        failedNames.push(it.name);
      }
    }

    onSaved?.();

    if (failedNames.length === 0) {
      onClose?.();
    } else if (failedNames.length === includedItems.length) {
      setError('Semua item gagal disimpan. Cek koneksi lalu coba lagi.');
      setStep('review');
    } else {
      setError(`Item berikut gagal disimpan, sisanya sudah tersimpan: ${failedNames.join(', ')}`);
      setItems((prev) => prev.filter((it) => failedNames.includes(it.name)));
      setStep('review');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-emerald-50/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#064E3B] text-white">
              <ScanLine size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Scan Struk</h2>
              <p className="text-xs text-slate-500">Foto struk, AI catatin otomatis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview struk"
                  className="w-32 h-32 object-cover rounded-xl border border-slate-200 opacity-50"
                />
              )}
              <p className="text-sm text-slate-500 text-center max-w-xs">
                Ambil foto struk belanja bahan baku, atau upload dari galeri.
              </p>
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition"
                >
                  <Camera size={22} />
                  <span className="text-xs font-semibold">Kamera</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 transition"
                >
                  <ImageUp size={22} />
                  <span className="text-xs font-semibold">Galeri</span>
                </button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-4 py-14">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview struk"
                  className="w-28 h-28 object-cover rounded-xl border border-slate-200"
                />
              )}
              <Loader2 size={26} className="animate-spin text-emerald-600" />
              <p className="text-sm text-slate-500">AI lagi baca struknya...</p>
            </div>
          )}

          {(step === 'review' || step === 'saving') && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500">
                Cek dulu hasil bacaan AI, edit kalau ada yang salah, lalu simpan.
              </p>

              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 w-fit">
                <span className="text-[11px] font-semibold text-slate-500 pl-2 pr-1">Tipe untuk semua:</span>
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAllType(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      opt.value === 'INCOME'
                        ? 'text-emerald-700 hover:bg-emerald-50'
                        : 'text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {items.map((it) => (
                <div
                  key={it._id}
                  className={`p-3 rounded-xl border ${
                    !it.include
                      ? 'border-slate-100 bg-slate-50 opacity-60'
                      : it.type === 'INCOME'
                      ? 'border-emerald-100 bg-emerald-50/40'
                      : 'border-rose-100 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={it.include}
                      onChange={(e) => updateItem(it._id, 'include', e.target.checked)}
                      className="mt-2 accent-emerald-600"
                    />
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) => updateItem(it._id, 'name', e.target.value)}
                        className="col-span-3 px-2 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        placeholder="Nama barang"
                      />
                      <div className="relative col-span-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={displayPrice(it.price)}
                          onChange={(e) => updateItem(it._id, 'price', parsePriceInput(e.target.value))}
                          className="w-full pl-7 pr-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="Harga"
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => updateItem(it._id, 'qty', e.target.value)}
                        className="col-span-1 px-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        placeholder="Qty"
                      />
                      <div className="col-span-1">
                        <CustomDropdown
                          value={it.type || 'EXPENSE'}
                          onChange={(v) => updateItem(it._id, 'type', v)}
                          options={TYPE_OPTIONS}
                          buttonClassName={`text-xs font-bold ${
                            it.type === 'INCOME'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-600'
                          }`}
                        />
                      </div>
                      <div className="col-span-3">
                        <CustomDropdown
                          value={it.category}
                          onChange={(v) => updateItem(it._id, 'category', v)}
                          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                          buttonClassName="text-sm bg-white border-slate-200 text-slate-700"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(it._id)}
                      className="mt-1 p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  Semua item dihapus. Batal atau scan ulang.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'review' || step === 'saving') && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 bg-white shrink-0">
            <div className="text-sm">
              <p className="text-slate-400 text-xs">Total ({includedItems.length} item)</p>
              <p className="font-bold text-slate-800">{formatRupiah(totalIncluded)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={step === 'saving'}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAll}
                disabled={includedItems.length === 0 || step === 'saving'}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#064E3B] hover:bg-[#053e2f] transition disabled:opacity-40 flex items-center gap-2"
              >
                {step === 'saving' && <Loader2 size={14} className="animate-spin" />}
                Simpan Semua
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}