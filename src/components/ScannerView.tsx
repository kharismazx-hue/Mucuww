import { ChangeEvent, FormEvent, useState } from "react";
import { Check, FileImage, Loader2, Receipt, Sparkles, Upload } from "lucide-react";
import {
  CategoryId,
  Currency,
  CustomCategory,
  Language,
  ReceiptScanResult,
  Transaction,
  TransactionType,
  Wallet,
} from "../types/finance";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryLabel,
  INCOME_CATEGORIES,
} from "../utils/format";

interface ScannerViewProps {
  wallets: Wallet[];
  customCategories?: CustomCategory[];
  currency: Currency;
  language: Language;
  onSaveTransaction: (tx: Omit<Transaction, "id">) => void;
  onScanComplete: () => void;
}

interface SampleReceiptSpec {
  id: string;
  label: string;
  merchant: string;
  date: string;
  lines: Array<{ name: string; price: string }>;
  total: string;
  payment: string;
}

const SAMPLE_RECEIPTS: SampleReceiptSpec[] = [
  {
    id: "kopi",
    label: "Struk Kopi Kenangan",
    merchant: "KOPI KENANGAN - SUDIRMAN",
    date: "2026-11-13 09:42",
    lines: [
      { name: "1x Es Kopi Kenangan Mantan (L)", price: "24.000" },
      { name: "1x Roti Coklat Klasik", price: "14.000" },
    ],
    total: "Rp 38.000",
    payment: "QRIS GOPAY",
  },
  {
    id: "indomaret",
    label: "Struk Indomaret",
    merchant: "INDOMARET KEMANG RAYA",
    date: "2026-11-12 19:15",
    lines: [
      { name: "1x Susu Oat 1L", price: "42.500" },
      { name: "2x Air Mineral 1.5L", price: "14.000" },
      { name: "1x Sabun Cuci Cair", price: "36.000" },
    ],
    total: "Rp 92.500",
    payment: "SHOPEEPAY",
  },
  {
    id: "qris",
    label: "Bukti QRIS Makan Siang",
    merchant: "BAKMI GM PLAZA SENAYAN",
    date: "2026-11-13 12:30",
    lines: [
      { name: "1x Bakmi Spesial GM", price: "44.000" },
      { name: "1x Pangsit Goreng (5pcs)", price: "25.000" },
      { name: "1x Es Teh Manis", price: "11.000" },
    ],
    total: "Rp 80.000",
    payment: "BCA QRIS",
  },
];

function buildSampleReceiptDataUrl(spec: SampleReceiptSpec): string {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#FAF8F2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#CBD5E1";
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(24, 24, 432, 472);
  ctx.setLineDash([]);

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillText(spec.merchant, 240, 74);

  ctx.fillStyle = "#475569";
  ctx.font = "14px monospace";
  ctx.fillText(`TANGGAL: ${spec.date}`, 240, 106);

  ctx.strokeStyle = "#94A3B8";
  ctx.beginPath();
  ctx.moveTo(48, 130);
  ctx.lineTo(432, 130);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#1E293B";
  ctx.font = "15px monospace";
  let y = 172;
  spec.lines.forEach((line) => {
    ctx.fillText(line.name, 48, y);
    ctx.textAlign = "right";
    ctx.fillText(line.price, 432, y);
    ctx.textAlign = "left";
    y += 38;
  });

  ctx.beginPath();
  ctx.moveTo(48, y + 10);
  ctx.lineTo(432, y + 10);
  ctx.stroke();

  ctx.font = "bold 22px monospace";
  ctx.fillStyle = "#0F172A";
  ctx.fillText("TOTAL BAYAR", 48, y + 58);
  ctx.textAlign = "right";
  ctx.fillText(spec.total, 432, y + 58);

  ctx.textAlign = "left";
  ctx.font = "15px monospace";
  ctx.fillStyle = "#059669";
  ctx.fillText(`METODE: ${spec.payment}`, 48, y + 105);
  ctx.fillStyle = "#64748B";
  ctx.fillText("STATUS: PEMBAYARAN BERHASIL", 48, y + 135);

  return canvas.toDataURL("image/png");
}

export function ScannerView({
  wallets,
  customCategories = [],
  currency,
  language,
  onSaveTransaction,
  onScanComplete,
}: ScannerViewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [mimeType, setMimeType] = useState<string>("image/png");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);

  // Editable draft fields after scan
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<CategoryId>("makan");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [savedBanner, setSavedBanner] = useState(false);

  const runScan = async (dataUrl: string, mime: string) => {
    setPreviewUrl(dataUrl);
    setMimeType(mime);
    setScanning(true);
    setScanError(null);
    setSavedBanner(false);

    try {
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: mime,
          language,
        }),
      });
      const data = (await res.json()) as ReceiptScanResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Gagal memindai struk.");
      }

      setScanResult(data);
      setMerchant(data.merchant);
      setAmount(String(data.amount));
      setType(data.type);
      setCategory(data.category);
      setDate(data.date);
      setNotes(data.notes);

      const matched = wallets.find((w) =>
        data.suggestedWallet
          ? w.name.toLowerCase().includes(data.suggestedWallet.toLowerCase())
          : false
      );
      if (matched) setWalletId(matched.id);
    } catch (err: unknown) {
      setScanError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memindai gambar."
      );
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void runScan(reader.result, file.type || "image/jpeg");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSampleClick = (spec: SampleReceiptSpec) => {
    const dataUrl = buildSampleReceiptDataUrl(spec);
    if (dataUrl) {
      void runScan(dataUrl, "image/png");
    }
  };

  const handleConfirmSave = (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/[^0-9]/g, ""));
    if (!merchant.trim() || !numericAmount || numericAmount <= 0 || !walletId) {
      setScanError(
        language === "en"
          ? "Complete merchant, amount, and wallet before saving."
          : "Lengkapi nama merchant, nominal, dan dompet sebelum menyimpan."
      );
      return;
    }

    onSaveTransaction({
      merchant: merchant.trim(),
      amount: numericAmount,
      type,
      category,
      walletId,
      date,
      notes: notes.trim() || undefined,
      source: "ai-scan",
    });

    setSavedBanner(true);
    setTimeout(() => {
      onScanComplete();
    }, 900);
  };

  const categories = [
    ...(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    ...customCategories.filter((c) => c.type === type).map((c) => c.id as CategoryId),
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Upload & Sample Receipt Presets */}
      <section className="glass-panel rounded-3xl p-6 lg:col-span-5">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Sparkles className="h-4 w-4" />
          <span>{language === "en" ? "AI Receipt & QRIS Vision" : "Pemindai Struk & QRIS AI"}</span>
        </div>
        <h2 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
          {language === "en"
            ? "Upload Receipt or Payment Screenshot"
            : "Unggah Struk Belanja atau Bukti QRIS"}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {language === "en"
            ? "Mucuw AI reads merchant name, total IDR amount, date, and category automatically."
            : "Mucuw AI membaca nama toko, total rupiah, tanggal, dan kategori secara otomatis tanpa ketik manual."}
        </p>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50/30 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-emerald-500">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview struk"
              className="max-h-56 rounded-lg border border-slate-200 object-contain dark:border-slate-700"
            />
          ) : (
            <>
              <Upload className="h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                {language === "en"
                  ? "Click to choose receipt photo"
                  : "Klik untuk pilih foto struk / screenshot"}
              </p>
              <p className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP</p>
            </>
          )}
        </label>

        {previewUrl && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{mimeType}</span>
            <button
              type="button"
              onClick={() => runScan(previewUrl, mimeType)}
              disabled={scanning}
              className="font-medium text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
            >
              {language === "en" ? "Re-scan image" : "Pindai ulang"}
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {language === "en"
              ? "Or try a sample Indonesian receipt:"
              : "Atau coba contoh struk instan:"}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {SAMPLE_RECEIPTS.map((spec) => (
              <button
                key={spec.id}
                type="button"
                disabled={scanning}
                onClick={() => handleSampleClick(spec)}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50/40 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{spec.label}</span>
                </span>
                <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {spec.total}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Right: Extracted Review Form */}
      <section className="glass-panel rounded-3xl p-6 lg:col-span-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {language === "en"
                ? "Extracted Transaction Details"
                : "Hasil Pembacaan Struk"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "en"
                ? "Review and adjust before saving to your wallet."
                : "Periksa nominal dan kategori sebelum disimpan ke dompet."}
            </p>
          </div>
          {scanResult && (
            <span className="font-mono text-xs font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
              {scanResult.confidence}% {language === "en" ? "confidence" : "akurat"}
            </span>
          )}
        </div>

        {scanning ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {language === "en"
                ? "Mucuw is reading your receipt..."
                : "Mucuw sedang membaca rincian struk..."}
            </p>
          </div>
        ) : !scanResult && !scanError ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-2 text-center">
            <FileImage className="h-10 w-10 text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {language === "en"
                ? "Upload an image or click a sample receipt on the left to start."
                : "Unggah foto struk atau pilih salah satu contoh di sebelah kiri."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirmSave} className="mt-5 space-y-4">
            {scanError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {scanError}
              </div>
            )}

            {scanResult?.mucuwComment && (
              <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                <span className="font-semibold">Mucuw: </span>
                <span>{scanResult.mucuwComment}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Merchant" : "Merchant / Toko"}
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Amount (IDR)" : "Nominal (Rp)"}
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                {Number(amount) > 0 && (
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
                    {formatCurrency(Number(amount), currency)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Type" : "Jenis"}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="expense">
                    {language === "en" ? "Expense" : "Pengeluaran"}
                  </option>
                  <option value="income">
                    {language === "en" ? "Income" : "Pemasukan"}
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Category" : "Kategori"}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat, language, customCategories)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Wallet" : "Dompet"}
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Date" : "Tanggal"}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Notes / Items" : "Rincian Item"}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              {savedBanner && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  <span>{language === "en" ? "Saved!" : "Tersimpan!"}</span>
                </span>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>
                  {language === "en" ? "Save to Transactions" : "Simpan ke Transaksi"}
                </span>
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
