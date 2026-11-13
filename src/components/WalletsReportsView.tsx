import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CalendarClock,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  AiInsightResult,
  AutoTransferRule,
  Budget,
  CategoryId,
  Currency,
  CustomCategory,
  DreamGoal,
  Language,
  Transaction,
  Wallet,
  WalletType,
} from "../types/finance";
import {
  formatCurrency,
  getCategoryColor,
  getCategoryLabel,
  getWalletTypeLabel,
} from "../utils/format";

interface WalletsReportsViewProps {
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  dreams: DreamGoal[];
  autoTransfers: AutoTransferRule[];
  customCategories?: CustomCategory[];
  selectedMonth: string;
  currency: Currency;
  language: Language;
  privacyMode: boolean;
  onAddWallet: (wallet: Omit<Wallet, "id">) => void;
  onTransferWallet: (fromId: string, toId: string, amount: number) => void;
  onAddAutoTransfer: (rule: Omit<AutoTransferRule, "id">) => void;
  onRunAutoTransfer: (id: string) => void;
  onDeleteAutoTransfer: (id: string) => void;
}

export function WalletsReportsView({
  wallets,
  transactions,
  budgets,
  dreams,
  autoTransfers,
  customCategories = [],
  selectedMonth,
  currency,
  language,
  privacyMode,
  onAddWallet,
  onTransferWallet,
  onAddAutoTransfer,
  onRunAutoTransfer,
  onDeleteAutoTransfer,
}: WalletsReportsViewProps) {
  const [showNewWallet, setShowNewWallet] = useState(false);
  const [wName, setWName] = useState("");
  const [wType, setWType] = useState<WalletType>("ewallet");
  const [wBalance, setWBalance] = useState("500000");

  const [showTransfer, setShowTransfer] = useState(false);
  const [fromWallet, setFromWallet] = useState(wallets[0]?.id ?? "");
  const [toWallet, setToWallet] = useState(wallets[1]?.id ?? wallets[0]?.id ?? "");
  const [transferAmount, setTransferAmount] = useState("250000");

  const [showAutoForm, setShowAutoForm] = useState(false);
  const [autoFrom, setAutoFrom] = useState(wallets[0]?.id ?? "");
  const [autoTo, setAutoTo] = useState(wallets[wallets.length - 1]?.id ?? "");
  const [autoAmt, setAutoAmt] = useState("1000000");
  const [autoFreq, setAutoFreq] = useState<"weekly" | "monthly">("monthly");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiInsightResult | null>(null);

  const monthlyTxs = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  const { totalIncome, totalExpense, categoryTotals } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const catMap: Record<string, number> = {};
    monthlyTxs.forEach((t) => {
      if (t.type === "income") inc += t.amount;
      else {
        exp += t.amount;
        catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
      }
    });
    const sortedCats = Object.entries(catMap)
      .map(([cat, amount]) => ({
        category: cat as CategoryId,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { totalIncome: inc, totalExpense: exp, categoryTotals: sortedCats };
  }, [monthlyTxs]);

  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  const handleAddWallet = (e: FormEvent) => {
    e.preventDefault();
    if (!wName.trim()) return;
    onAddWallet({
      name: wName.trim(),
      type: wType,
      balance: Math.max(0, Number(wBalance) || 0),
    });
    setWName("");
    setShowNewWallet(false);
  };

  const handleTransfer = (e: FormEvent) => {
    e.preventDefault();
    const amt = Math.max(0, Number(transferAmount) || 0);
    if (fromWallet && toWallet && fromWallet !== toWallet && amt > 0) {
      onTransferWallet(fromWallet, toWallet, amt);
      setShowTransfer(false);
    }
  };

  const handleRunAiAudit = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const summary = {
        month: selectedMonth,
        totalIncome,
        totalExpense,
        savingsRatePercent: savingsRate,
        topCategories: categoryTotals.map((c) => ({
          category: getCategoryLabel(c.category, language, customCategories),
          spent: c.amount,
        })),
        budgets: budgets.map((b) => ({
          category: getCategoryLabel(b.category, language, customCategories),
          limit: b.monthlyLimit,
        })),
        dreamsCount: dreams.length,
      };

      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, language }),
      });
      const data = (await res.json()) as AiInsightResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Gagal menjalankan audit AI.");
      }
      setAiResult(data);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Gagal terhubung ke Mucuw AI.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Multi-Wallets Section */}
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col gap-3 border-b border-white/60 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {language === "en" ? "Wallets & Accounts" : "Dompet & Rekening"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "en"
                ? "Manage cash, bank accounts, and e-wallets in one view."
                : "Kelola saldo tunai, rekening bank, dan e-wallet dalam satu tempat."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTransfer((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>{language === "en" ? "Transfer" : "Pindah Saldo"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewWallet((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{language === "en" ? "Add Wallet" : "Tambah Dompet"}</span>
            </button>
          </div>
        </div>

        {showTransfer && (
          <form
            onSubmit={handleTransfer}
            className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:grid-cols-4"
          >
            <select
              value={fromWallet}
              onChange={(e) => setFromWallet(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  Dari: {w.name}
                </option>
              ))}
            </select>
            <select
              value={toWallet}
              onChange={(e) => setToWallet(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  Ke: {w.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1000}
              step={10000}
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
            >
              {language === "en" ? "Confirm Transfer" : "Kirim Saldo"}
            </button>
          </form>
        )}

        {showNewWallet && (
          <form
            onSubmit={handleAddWallet}
            className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:grid-cols-4"
          >
            <input
              type="text"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder="Contoh: Mandiri, OVO, Dana"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={wType}
              onChange={(e) => setWType(e.target.value as WalletType)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="ewallet">Dompet Digital</option>
              <option value="bank">Rekening Bank</option>
              <option value="cash">Uang Tunai</option>
              <option value="savings">Tabungan</option>
            </select>
            <input
              type="number"
              value={wBalance}
              onChange={(e) => setWBalance(e.target.value)}
              placeholder="Saldo awal"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
            >
              {language === "en" ? "Save Wallet" : "Simpan Dompet"}
            </button>
          </form>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="glass-soft rounded-2xl p-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{getWalletTypeLabel(w.type, language)}</span>
                <WalletIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {w.name}
              </p>
              <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(w.balance, currency, privacyMode)}
              </p>
              {w.accountHint && (
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  {w.accountHint}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Auto-Transfer Schedule (Mochi Dompet style) */}
        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === "en"
                  ? "Scheduled Auto-Transfers"
                  : "Jadwal Auto-Transfer Rutin"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAutoForm((v) => !v)}
              className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
            >
              {showAutoForm ? "Tutup" : "+ Buat Jadwal"}
            </button>
          </div>

          {showAutoForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = Math.max(0, Number(autoAmt) || 0);
                if (autoFrom && autoTo && autoFrom !== autoTo && amt > 0) {
                  onAddAutoTransfer({
                    fromWalletId: autoFrom,
                    toWalletId: autoTo,
                    amount: amt,
                    freq: autoFreq,
                    nextDate: new Date().toISOString().slice(0, 10),
                    active: true,
                  });
                  setShowAutoForm(false);
                }
              }}
              className="mt-3 grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-700 dark:bg-slate-900/40 sm:grid-cols-5"
            >
              <select
                value={autoFrom}
                onChange={(e) => setAutoFrom(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    Dari: {w.name}
                  </option>
                ))}
              </select>
              <select
                value={autoTo}
                onChange={(e) => setAutoTo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    Ke: {w.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step={50000}
                value={autoAmt}
                onChange={(e) => setAutoAmt(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums dark:border-slate-700 dark:bg-slate-900"
              />
              <select
                value={autoFreq}
                onChange={(e) => setAutoFreq(e.target.value as "weekly" | "monthly")}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="monthly">Tiap Bulan</option>
                <option value="weekly">Tiap Minggu</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 cursor-pointer"
              >
                Simpan Jadwal
              </button>
            </form>
          )}

          <div className="mt-3 space-y-2">
            {autoTransfers.map((rule) => {
              const fromName =
                wallets.find((w) => w.id === rule.fromWalletId)?.name ?? "Dompet";
              const toName =
                wallets.find((w) => w.id === rule.toWalletId)?.name ?? "Dompet";
              return (
                <div
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 px-4 py-2.5 text-xs dark:border-slate-800"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {fromName} → {toName}
                    </span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      · {rule.freq === "monthly" ? "Bulanan" : "Mingguan"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(rule.amount, currency, privacyMode)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRunAutoTransfer(rule.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Play className="h-3 w-3" />
                      <span>Jalankan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAutoTransfer(rule.id)}
                      aria-label="Hapus jadwal"
                      className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Analytics + Mucuw AI Advisor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="glass-panel rounded-3xl p-6 lg:col-span-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {language === "en"
              ? "Expense Breakdown by Category"
              : "Distribusi Pengeluaran Kategori"}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {language === "en" ? "Savings Rate:" : "Rasio Tabungan:"}{" "}
            <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {savingsRate}%
            </span>
          </p>

          <div className="mt-5 space-y-3.5">
            {categoryTotals.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {language === "en"
                  ? "No expense data this month."
                  : "Belum ada pengeluaran bulan ini."}
              </p>
            ) : (
              categoryTotals.map((item) => {
                const share =
                  totalExpense > 0
                    ? Math.round((item.amount / totalExpense) * 100)
                    : 0;
                const catColor = getCategoryColor(item.category, customCategories);
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {getCategoryLabel(item.category, language, customCategories)}
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.amount, currency, privacyMode)} · {share}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, backgroundColor: catColor }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 pb-4 dark:border-white/10">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {language === "en"
                  ? "Mucuw AI Anti-Leak Audit"
                  : "Audit Keuangan Mucuw AI"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Real-time diagnosis of spending leaks and saving tips."
                  : "Analisis kebocoran kas & saran penghematan spesifik dari transaksimu."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunAiAudit}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>
                {language === "en" ? "Run Audit" : "Analisis Sekarang"}
              </span>
            </button>
          </div>

          {aiError && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {aiError}
            </div>
          )}

          {!aiResult && !aiLoading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Click Run Audit to let Mucuw inspect your cashflow."
                  : "Klik Analisis Sekarang untuk mendeteksi pos pengeluaran yang diam-diam bocor."}
              </p>
            </div>
          ) : aiLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Mucuw is crunching your numbers..."
                  : "Mucuw sedang memeriksa arus kas bulan ini..."}
              </p>
            </div>
          ) : aiResult ? (
            <div className="mt-5 space-y-4">
              <div>
                <h4 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  {aiResult.headline}
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {aiResult.mucuwSpeech}
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <span className="font-semibold">
                  {language === "en" ? "Leak Alert: " : "Deteksi Kebocoran: "}
                </span>
                <span>{aiResult.leakAlert}</span>
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {aiResult.actionableTips.map((tip, idx) => (
                  <div key={idx} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {tip.title}
                      </p>
                      <span className="font-mono text-xs tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        +{formatCurrency(tip.estimatedMonthlySaving, currency, privacyMode)}/bln
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {tip.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
