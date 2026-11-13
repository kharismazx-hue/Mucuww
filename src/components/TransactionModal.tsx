import { FormEvent, useEffect, useState } from "react";
import { Calculator, Delete, X } from "lucide-react";
import {
  CategoryId,
  CustomCategory,
  Language,
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

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, "id">) => void;
  wallets: Wallet[];
  language: Language;
  customCategories?: CustomCategory[];
  initialData?: Partial<Omit<Transaction, "id">>;
}

function evaluateCalc(expr: string): number | null {
  const clean = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  if (!/^[0-9+\-*/ ]+$/.test(clean)) return null;
  const trimmed = clean.replace(/[+\-*/ ]+$/, "");
  if (!trimmed) return 0;
  // Safe simple left-to-right / standard math parser using tokens
  const tokens = trimmed.match(/(\d+|[+\-*/])/g);
  if (!tokens) return null;
  try {
    // Handle * and / first, then + and -
    const pass1: Array<number | string> = [];
    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];
      if ((tok === "*" || tok === "/") && pass1.length > 0 && i + 1 < tokens.length) {
        const left = Number(pass1.pop());
        const right = Number(tokens[i + 1]);
        if (tok === "/" && right === 0) return null;
        pass1.push(tok === "*" ? left * right : left / right);
        i += 2;
      } else {
        pass1.push(i % 2 === 0 ? Number(tok) : tok);
        i += 1;
      }
    }
    let result = Number(pass1[0]);
    for (let j = 1; j < pass1.length; j += 2) {
      const op = pass1[j];
      const val = Number(pass1[j + 1]);
      if (Number.isNaN(val)) break;
      result = op === "+" ? result + val : result - val;
    }
    return Number.isFinite(result) ? Math.max(0, Math.round(result)) : null;
  } catch {
    return null;
  }
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  wallets,
  language,
  customCategories = [],
  initialData,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type ?? "expense");
  const [merchant, setMerchant] = useState(initialData?.merchant ?? "");
  const [amount, setAmount] = useState(
    initialData?.amount ? String(initialData.amount) : ""
  );
  const [category, setCategory] = useState<CategoryId>(
    initialData?.category ?? "makan"
  );
  const [walletId, setWalletId] = useState(
    initialData?.walletId ?? wallets[0]?.id ?? ""
  );
  const [date, setDate] = useState(
    initialData?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [error, setError] = useState("");
  const [showCalc, setShowCalc] = useState(false);
  const [calcExpr, setCalcExpr] = useState("");

  useEffect(() => {
    if (isOpen) {
      setType(initialData?.type ?? "expense");
      setMerchant(initialData?.merchant ?? "");
      setAmount(initialData?.amount ? String(initialData.amount) : "");
      setCategory(initialData?.category ?? "makan");
      setWalletId(initialData?.walletId ?? wallets[0]?.id ?? "");
      setDate(initialData?.date ?? new Date().toISOString().slice(0, 10));
      setNotes(initialData?.notes ?? "");
      setError("");
      setShowCalc(false);
      setCalcExpr(initialData?.amount ? String(initialData.amount) : "");
    }
  }, [isOpen, initialData, wallets]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const customForType = customCategories
    .filter((c) => c.type === type)
    .map((c) => c.id as CategoryId);

  const availableCategories = [
    ...(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    ...customForType,
  ];

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const nextCustom = customCategories
      .filter((c) => c.type === nextType)
      .map((c) => c.id as CategoryId);
    const list = [
      ...(nextType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
      ...nextCustom,
    ];
    if (!list.includes(category)) {
      setCategory(list[0]);
    }
  };

  const handleCalcTap = (val: string) => {
    if (val === "C") {
      setCalcExpr("");
      setAmount("");
      return;
    }
    if (val === "DEL") {
      const next = calcExpr.slice(0, -1);
      setCalcExpr(next);
      const res = evaluateCalc(next);
      if (res !== null) setAmount(String(res));
      return;
    }
    if (val === "=") {
      const res = evaluateCalc(calcExpr);
      if (res !== null) {
        setAmount(String(res));
        setCalcExpr(String(res));
      }
      setShowCalc(false);
      return;
    }
    const next = calcExpr + val;
    setCalcExpr(next);
    const res = evaluateCalc(next);
    if (res !== null) setAmount(String(res));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/[^0-9]/g, ""));
    if (!merchant.trim()) {
      setError(
        language === "en"
          ? "Please enter a merchant or title."
          : "Nama transaksi atau merchant wajib diisi."
      );
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError(
        language === "en"
          ? "Amount must be greater than 0."
          : "Nominal harus lebih besar dari Rp 0."
      );
      return;
    }
    if (!walletId) {
      setError(
        language === "en" ? "Please select a wallet." : "Pilih dompet terlebih dahulu."
      );
      return;
    }

    onSave({
      merchant: merchant.trim(),
      amount: numericAmount,
      type,
      category,
      walletId,
      date,
      notes: notes.trim() || undefined,
      source: initialData?.source ?? "manual",
    });
    onClose();
  };

  const calcPreview = evaluateCalc(calcExpr);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
      onClick={onClose}
    >
      <div
        className="glass-modal max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3
            id="tx-modal-title"
            className="font-display text-lg font-semibold text-[#241F35] dark:text-slate-100"
          >
            {language === "en" ? "Record Transaction" : "Catat Transaksi Baru"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === "en" ? "Close" : "Tutup"}
            className="rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#F3F0FA] p-1 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`rounded-xl py-2 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                type === "expense"
                  ? "bg-[#FFE4EF] text-[#241F35] shadow-xs dark:bg-slate-900 dark:text-rose-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {language === "en" ? "Expense" : "Pengeluaran"}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`rounded-xl py-2 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                type === "income"
                  ? "bg-[#DDF8E8] text-[#241F35] shadow-xs dark:bg-slate-900 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {language === "en" ? "Income" : "Pemasukan"}
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === "en" ? "Merchant / Description" : "Nama Merchant / Keperluan"}
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={
                type === "expense"
                  ? "Contoh: Bakso, Kopi Kenangan, Indomaret"
                  : "Contoh: Gaji Bulanan, Proyek Desain"
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Amount (IDR)" : "Nominal (Rp)"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCalcExpr(amount || "");
                    setShowCalc((v) => !v);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
                >
                  <Calculator className="h-3 w-3" />
                  <span>{showCalc ? "Tutup" : "Kalkulator"}</span>
                </button>
              </div>
              <input
                type="number"
                min={1}
                step={500}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="35000"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Date" : "Tanggal"}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Mochi-style Built-in Calculator Keypad */}
          {showCalc && (
            <div className="rounded-2xl border border-[#241F35]/15 bg-[#F9F7FD] p-3.5 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="mb-2.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 font-mono text-xs dark:bg-slate-800">
                <span className="truncate text-slate-600 dark:text-slate-300">
                  {calcExpr || "0"}
                </span>
                <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {calcPreview !== null ? formatCurrency(calcPreview, "IDR") : "…"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-sm font-semibold">
                {[
                  "7",
                  "8",
                  "9",
                  "+",
                  "4",
                  "5",
                  "6",
                  "-",
                  "1",
                  "2",
                  "3",
                  "×",
                  "C",
                  "0",
                  "000",
                  "=",
                ].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleCalcTap(btn)}
                    className={`rounded-xl py-2 transition-colors cursor-pointer ${
                      btn === "="
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : ["+", "-", "×"].includes(btn)
                          ? "bg-[#E8DFFD] text-[#241F35] hover:bg-[#DCCBFF] dark:bg-slate-700 dark:text-slate-100"
                          : btn === "C"
                            ? "bg-[#FFE4EF] text-rose-700 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleCalcTap("DEL")}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <Delete className="h-3.5 w-3.5" />
                <span>Hapus digit</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Category" : "Kategori"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat, language, customCategories)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Wallet" : "Dompet / Sumber Dana"}
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {language === "en" ? "Notes (Optional)" : "Catatan (Opsional)"}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                language === "en"
                  ? "Short details..."
                  : "Rincian singkat transaksi..."
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              {language === "en" ? "Cancel" : "Batal"}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#241F35] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
            >
              {language === "en" ? "Save Transaction" : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
