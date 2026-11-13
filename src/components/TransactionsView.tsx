import { FormEvent, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Download,
  Loader2,
  Pause,
  Play,
  Plus,
  Repeat,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  CategoryId,
  Currency,
  CustomCategory,
  Language,
  ReceiptScanResult,
  RecurringTransactionRule,
  Transaction,
  TransactionType,
  Wallet,
} from "../types/finance";
import {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCurrency,
  formatShortDate,
  getCategoryColor,
  getCategoryLabel,
} from "../utils/format";
import { CategoryIcon } from "./CategoryIcon";

interface TransactionsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  recurringRules: RecurringTransactionRule[];
  customCategories?: CustomCategory[];
  selectedMonth: string;
  currency: Currency;
  language: Language;
  privacyMode: boolean;
  autoPostedNotice?: string | null;
  onDismissAutoPostedNotice?: () => void;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onDeleteTransaction: (id: string) => void;
  onAddRecurringRule: (
    rule: Omit<RecurringTransactionRule, "id">,
    startNextMonth: boolean
  ) => void;
  onToggleRecurringRule: (id: string) => void;
  onRunRecurringNow: (id: string) => void;
  onDeleteRecurringRule: (id: string) => void;
  onOpenModal: () => void;
}

const NOTIF_PRESETS = [
  {
    label: "Notif GoPay QRIS",
    text: "Pembayaran QRIS berhasil Rp 28.000 di Toko Kopi Tuku pakai GoPay",
  },
  {
    label: "Notif ShopeePay",
    text: "Transaksi ShopeePay Rp 65.000 untuk Makan Siang Bakmi GM berhasil",
  },
  {
    label: "Notif BCA Masuk",
    text: "Transfer masuk BCA Rp 500.000 dari Klien Proyek Desain",
  },
];

export function TransactionsView({
  transactions,
  wallets,
  recurringRules,
  customCategories = [],
  selectedMonth,
  currency,
  language,
  privacyMode,
  autoPostedNotice,
  onDismissAutoPostedNotice,
  onAddTransaction,
  onDeleteTransaction,
  onAddRecurringRule,
  onToggleRecurringRule,
  onRunRecurringNow,
  onDeleteRecurringRule,
  onOpenModal,
}: TransactionsViewProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [walletFilter, setWalletFilter] = useState<string>("all");

  const [quickText, setQuickText] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [exportedCount, setExportedCount] = useState<number | null>(null);

  // Recurring monthly schedule form state
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recMerchant, setRecMerchant] = useState("");
  const [recType, setRecType] = useState<TransactionType>("expense");
  const [recAmount, setRecAmount] = useState("500000");
  const [recCategory, setRecCategory] = useState<CategoryId>("tagihan");
  const [recWallet, setRecWallet] = useState<string>(wallets[0]?.id ?? "w-bca");
  const [recDay, setRecDay] = useState("1");
  const [recNotes, setRecNotes] = useState("");
  const [recStartNextMonth, setRecStartNextMonth] = useState(false);

  const walletMap = useMemo(() => {
    const map: Record<string, string> = {};
    wallets.forEach((w) => {
      map[w.id] = w.name;
    });
    return map;
  }, [wallets]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) => (categoryFilter === "all" ? true : t.category === categoryFilter))
      .filter((t) => (walletFilter === "all" ? true : t.walletId === walletFilter))
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.merchant.toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q) ||
          getCategoryLabel(t.category, language, customCategories).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [
    transactions,
    selectedMonth,
    typeFilter,
    categoryFilter,
    walletFilter,
    search,
    language,
    customCategories,
  ]);

  const totals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filtered.forEach((t) => {
      if (t.type === "income") inc += t.amount;
      else exp += t.amount;
    });
    return { inc, exp };
  }, [filtered]);

  const runQuickParse = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setQuickLoading(true);
    setQuickError(null);
    setQuickFeedback(null);

    try {
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textNote: textToParse.trim(), language }),
      });
      const data = (await res.json()) as ReceiptScanResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses catatan cepat.");
      }

      const matchedWallet =
        wallets.find((w) =>
          data.suggestedWallet
            ? w.name.toLowerCase().includes(data.suggestedWallet.toLowerCase())
            : false
        ) ?? wallets[0];

      onAddTransaction({
        merchant: data.merchant,
        amount: data.amount,
        type: data.type,
        category: data.category,
        walletId: matchedWallet?.id ?? "w-bca",
        date: data.date,
        notes: data.notes || textToParse.trim(),
        source: "ai-scan",
      });

      setQuickText("");
      setQuickFeedback(
        `${data.merchant} (${formatCurrency(data.amount, currency, privacyMode)}) — ${data.mucuwComment}`
      );
    } catch (err: unknown) {
      setQuickError(
        err instanceof Error ? err.message : "Gagal mencatat dengan AI."
      );
    } finally {
      setQuickLoading(false);
    }
  };

  const handleQuickParse = async (e: FormEvent) => {
    e.preventDefault();
    await runQuickParse(quickText);
  };

  const escapeCsvCell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) return;

    const header =
      language === "en"
        ? ["Date", "Merchant", "Type", "Category", "Wallet", "Amount (IDR)", "Notes"]
        : ["Tanggal", "Merchant", "Jenis", "Kategori", "Dompet", "Nominal (IDR)", "Catatan"];

    const rows = filtered.map((t) => [
      escapeCsvCell(t.date),
      escapeCsvCell(t.merchant),
      escapeCsvCell(
        t.type === "income"
          ? language === "en"
            ? "Income"
            : "Pemasukan"
          : language === "en"
            ? "Expense"
            : "Pengeluaran"
      ),
      escapeCsvCell(getCategoryLabel(t.category, language, customCategories)),
      escapeCsvCell(walletMap[t.walletId] ?? "-"),
      String(t.amount),
      escapeCsvCell(t.notes ?? ""),
    ]);

    const csvContent = "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      language === "en"
        ? `mucuw-transactions-${selectedMonth}.csv`
        : `mucuw-transaksi-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setExportedCount(filtered.length);
    setTimeout(() => {
      setExportedCount((prev) => (prev === filtered.length ? null : prev));
    }, 2500);
  };

  const recurringCategories: CategoryId[] = useMemo(() => {
    const base = recType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const custom = customCategories
      .filter((c) => c.type === recType)
      .map((c) => c.id as CategoryId);
    return [...base, ...custom];
  }, [recType, customCategories]);

  const monthlyRecurringTotal = useMemo(
    () =>
      recurringRules
        .filter((r) => r.active && r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0),
    [recurringRules]
  );

  const handleCreateRecurring = (e: FormEvent) => {
    e.preventDefault();
    const amt = Math.max(0, Number(recAmount.replace(/[^0-9]/g, "")));
    const day = Math.min(31, Math.max(1, Number(recDay) || 1));
    if (!recMerchant.trim() || amt <= 0) return;

    onAddRecurringRule(
      {
        merchant: recMerchant.trim(),
        amount: amt,
        type: recType,
        category: recurringCategories.includes(recCategory)
          ? recCategory
          : recurringCategories[0],
        walletId: recWallet || wallets[0]?.id || "w-bca",
        dayOfMonth: day,
        notes: recNotes.trim() || undefined,
        active: true,
      },
      recStartNextMonth
    );

    setRecMerchant("");
    setRecNotes("");
    setShowRecurringForm(false);
  };

  return (
    <div className="space-y-6">
      {autoPostedNotice && (
        <div
          role="status"
          className="glass-panel flex items-center justify-between gap-3 rounded-2xl border-emerald-300/80 bg-emerald-50/75 px-4 py-3 text-xs font-medium text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-950/50 dark:text-emerald-200"
        >
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{autoPostedNotice}</span>
          </div>
          {onDismissAutoPostedNotice && (
            <button
              type="button"
              onClick={onDismissAutoPostedNotice}
              aria-label={language === "en" ? "Dismiss notice" : "Tutup pemberitahuan"}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/50 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {/* Quick Natural-Language Entry */}
      <section className="glass-panel rounded-3xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {language === "en"
                ? "Quick Chat Entry"
                : "Catat Cepat Bahasa Sehari-hari"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "en"
                ? 'Type naturally like "Matcha Fore 39k via GoPay" and Mucuw logs it.'
                : 'Ketik santai seperti "Kopi Tuku 28rb pakai GoPay" lalu Mucuw langsung rapikan.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{language === "en" ? "Manual Form" : "Form Manual"}</span>
          </button>
        </div>

        <form onSubmit={handleQuickParse} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder={
              language === "en"
                ? "e.g. Lunch Bakmi GM 65k paid with ShopeePay"
                : "Contoh: Makan siang warteg 25rb pakai tunai"
            }
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={quickLoading || !quickText.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {quickLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>{language === "en" ? "Log with AI" : "Catat AI"}</span>
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {language === "en"
              ? "Auto-detect notification:"
              : "Simulasi deteksi notif:"}
          </span>
          {NOTIF_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={quickLoading}
              onClick={() => {
                setQuickText(preset.text);
                void runQuickParse(preset.text);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 whitespace-nowrap cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {quickFeedback && (
          <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {quickFeedback}
          </p>
        )}
        {quickError && (
          <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">
            {quickError}
          </p>
        )}
      </section>

      {/* Recurring Monthly Transactions Scheduler */}
      <section className="glass-panel rounded-3xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {language === "en"
                  ? "Recurring Monthly Transactions"
                  : "Jadwal Transaksi Rutin Bulanan"}
              </h2>
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {recurringRules.filter((r) => r.active).length}{" "}
                {language === "en" ? "active" : "aktif"}
                {" · "}
                {formatCurrency(monthlyRecurringTotal, currency, privacyMode)}/bln
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "en"
                ? "Schedule rent, utilities, or subscriptions to post automatically on your chosen day each month."
                : "Jadwalkan sewa kos, tagihan, atau langganan agar otomatis tercatat ke ledger tiap tanggal yang ditentukan."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRecurringForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#241F35] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>
              {showRecurringForm
                ? language === "en"
                  ? "Close Form"
                  : "Tutup Form"
                : language === "en"
                  ? "Schedule Monthly"
                  : "Tambah Jadwal Rutin"}
            </span>
          </button>
        </div>

        {showRecurringForm && (
          <form
            onSubmit={handleCreateRecurring}
            className="glass-soft mt-4 grid grid-cols-1 gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Title / Merchant" : "Nama Tagihan / Langganan"}
              </label>
              <input
                type="text"
                required
                value={recMerchant}
                onChange={(e) => setRecMerchant(e.target.value)}
                placeholder={
                  language === "en"
                    ? "e.g. Apartment Rent, Netflix"
                    : "Mis. Sewa Kos, Netflix, Gym"
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Type" : "Jenis"}
              </label>
              <select
                value={recType}
                onChange={(e) => {
                  const nextType = e.target.value as TransactionType;
                  setRecType(nextType);
                  setRecCategory(nextType === "expense" ? "tagihan" : "gaji");
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Amount (IDR)" : "Nominal (Rp)"}
              </label>
              <input
                type="number"
                min={1000}
                step={10000}
                required
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Category" : "Kategori"}
              </label>
              <select
                value={
                  recurringCategories.includes(recCategory)
                    ? recCategory
                    : recurringCategories[0]
                }
                onChange={(e) => setRecCategory(e.target.value as CategoryId)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {recurringCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat, language, customCategories)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Day of Month (1–31)" : "Setiap Tanggal (1–31)"}
              </label>
              <input
                type="number"
                min={1}
                max={31}
                required
                value={recDay}
                onChange={(e) => setRecDay(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Wallet" : "Dompet Pembayaran"}
              </label>
              <select
                value={recWallet}
                onChange={(e) => setRecWallet(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {language === "en" ? "Notes (Optional)" : "Catatan (Opsional)"}
              </label>
              <input
                type="text"
                value={recNotes}
                onChange={(e) => setRecNotes(e.target.value)}
                placeholder={
                  language === "en"
                    ? "Auto-debit or reminder note..."
                    : "Mis. Autodebet rekening utama..."
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recStartNextMonth}
                  onChange={(e) => setRecStartNextMonth(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-emerald-600"
                />
                <span>
                  {language === "en" ? "Start next month" : "Mulai bulan depan"}
                </span>
              </label>

              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
              >
                {language === "en" ? "Save Schedule" : "Simpan Jadwal"}
              </button>
            </div>
          </form>
        )}

        {recurringRules.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {language === "en"
              ? "No recurring monthly transactions scheduled yet."
              : "Belum ada transaksi rutin bulanan yang dijadwalkan."}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recurringRules.map((rule) => {
              const isPostedThisMonth =
                Boolean(rule.lastGeneratedMonth) &&
                rule.lastGeneratedMonth! >= selectedMonth;
              const catColor = getCategoryColor(rule.category, customCategories);

              return (
                <div
                  key={rule.id}
                  className={`glass-soft flex flex-col justify-between rounded-2xl p-4 transition-opacity ${
                    rule.active ? "" : "opacity-65"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800"
                          style={{ color: catColor }}
                        >
                          <CategoryIcon category={rule.category} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {rule.merchant}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {getCategoryLabel(rule.category, language, customCategories)}
                            {" · "}
                            {walletMap[rule.walletId] ?? "-"}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                          rule.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {rule.type === "income" ? "+" : "-"}
                        {formatCurrency(rule.amount, currency, privacyMode)}
                      </p>
                    </div>

                    <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="font-mono tabular-nums">
                        {language === "en"
                          ? `Day ${rule.dayOfMonth} monthly`
                          : `Tiap tanggal ${rule.dayOfMonth}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          !rule.active
                            ? "text-slate-500"
                            : isPostedThisMonth
                              ? "font-medium text-emerald-700 dark:text-emerald-400"
                              : "font-medium text-amber-700 dark:text-amber-400"
                        }
                      >
                        {!rule.active
                          ? language === "en"
                            ? "Paused"
                            : "Dijeda"
                          : isPostedThisMonth
                            ? language === "en"
                              ? "Posted this month"
                              : "Sudah masuk bulan ini"
                            : language === "en"
                              ? `Scheduled (${selectedMonth}-${String(rule.dayOfMonth).padStart(2, "0")})`
                              : `Menunggu tgl ${rule.dayOfMonth}`}
                      </span>
                    </p>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/60 pt-3 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => onRunRecurringNow(rule.id)}
                      className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap cursor-pointer"
                    >
                      {language === "en" ? "Post now" : "Catat sekarang"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleRecurringRule(rule.id)}
                        title={
                          rule.active
                            ? language === "en"
                              ? "Pause schedule"
                              : "Jeda jadwal"
                            : language === "en"
                              ? "Resume schedule"
                              : "Aktifkan jadwal"
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                      >
                        {rule.active ? (
                          <>
                            <Pause className="h-3 w-3" />
                            <span>{language === "en" ? "Pause" : "Jeda"}</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            <span>{language === "en" ? "Resume" : "Aktif"}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteRecurringRule(rule.id)}
                        aria-label={`Hapus jadwal ${rule.merchant}`}
                        className="rounded-lg p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Filter & Ledger */}
      <section className="glass-panel rounded-3xl">
        <div className="flex flex-col gap-4 border-b border-white/60 p-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
              {(["all", "expense", "income"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTypeFilter(mode)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    typeFilter === mode
                      ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {mode === "all"
                    ? language === "en"
                      ? "All"
                      : "Semua"
                    : mode === "expense"
                      ? language === "en"
                        ? "Expenses"
                        : "Pengeluaran"
                      : language === "en"
                        ? "Income"
                        : "Pemasukan"}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter Kategori"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">
                {language === "en" ? "All Categories" : "Semua Kategori"}
              </option>
              {[
                ...(Object.keys(CATEGORIES) as CategoryId[]),
                ...customCategories.map((c) => c.id as CategoryId),
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat, language, customCategories)}
                </option>
              ))}
            </select>

            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              aria-label="Filter Dompet"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">
                {language === "en" ? "All Wallets" : "Semua Dompet"}
              </option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-56 sm:flex-none">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === "en" ? "Search merchant..." : "Cari transaksi..."}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-8 text-xs text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              title={
                language === "en"
                  ? `Export ${filtered.length} filtered transactions to CSV`
                  : `Ekspor ${filtered.length} transaksi terfilter ke CSV`
              }
              className="glass-soft inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:text-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {exportedCount !== null ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {language === "en"
                      ? `Exported (${exportedCount})`
                      : `Terekspor (${exportedCount})`}
                  </span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>
                    {language === "en" ? "Export CSV" : "Ekspor CSV"}{" "}
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      ({filtered.length})
                    </span>
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/60 bg-white/40 px-5 py-3 text-xs dark:border-white/10 dark:bg-white/5">
          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
            {filtered.length} {language === "en" ? "entries" : "transaksi"}
          </span>
          <div className="flex items-center gap-4 font-mono tabular-nums">
            <span className="text-emerald-700 dark:text-emerald-400">
              +{formatCurrency(totals.inc, currency, privacyMode)}
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              -{formatCurrency(totals.exp, currency, privacyMode)}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {language === "en"
                ? "No transactions match your current filter."
                : "Tidak ada transaksi yang sesuai filter saat ini."}
            </p>
            <button
              type="button"
              onClick={onOpenModal}
              className="mt-3 text-sm font-medium text-emerald-600 hover:underline cursor-pointer"
            >
              {language === "en" ? "Add new transaction" : "Tambah transaksi baru"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3">{language === "en" ? "Merchant" : "Transaksi"}</th>
                  <th className="px-4 py-3">{language === "en" ? "Category" : "Kategori"}</th>
                  <th className="px-4 py-3">{language === "en" ? "Wallet" : "Dompet"}</th>
                  <th className="px-4 py-3">{language === "en" ? "Date" : "Tanggal"}</th>
                  <th className="px-4 py-3 text-right">{language === "en" ? "Amount" : "Nominal"}</th>
                  <th className="px-5 py-3 text-right">{language === "en" ? "Action" : "Hapus"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((tx) => {
                  const catColor = getCategoryColor(tx.category, customCategories);
                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                            style={{ color: catColor }}
                          >
                            <CategoryIcon category={tx.category} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {tx.merchant}
                            </p>
                            {(tx.notes || tx.source === "recurring") && (
                              <p className="max-w-xs truncate text-xs text-slate-500 dark:text-slate-400">
                                {tx.notes ?? ""}
                                {tx.notes && tx.source === "recurring" ? " · " : ""}
                                {tx.source === "recurring"
                                  ? language === "en"
                                    ? "Recurring"
                                    : "Rutin otomatis"
                                  : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {getCategoryLabel(tx.category, language, customCategories)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {walletMap[tx.walletId] ?? "-"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatShortDate(tx.date, language)}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono text-sm font-medium tabular-nums whitespace-nowrap ${
                          tx.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount, currency, privacyMode)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          aria-label={`Hapus ${tx.merchant}`}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
