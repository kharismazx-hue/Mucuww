import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  RefreshCw,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Currency,
  CustomCategory,
  Language,
  Transaction,
} from "../types/finance";
import {
  formatCurrency,
  formatMonthLabel,
  getCategoryLabel,
} from "../utils/format";

interface SpendingTipResult {
  headline: string;
  tip: string;
  focusMerchant: string;
  impactType: "warning" | "positive" | "neutral";
  estimatedMonthlySaving: number;
}

interface SpendingTrendTipProps {
  transactions: Transaction[];
  customCategories: CustomCategory[];
  selectedMonth: string;
  prevMonthKey: string;
  selectedWalletFilter: string;
  currency: Currency;
  language: Language;
  privacyMode: boolean;
}

const tipCache = new Map<string, SpendingTipResult>();

export function SpendingTrendTip({
  transactions,
  customCategories,
  selectedMonth,
  prevMonthKey,
  selectedWalletFilter,
  currency,
  language,
  privacyMode,
}: SpendingTrendTipProps) {
  const [tipData, setTipData] = useState<SpendingTipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const analysisPayload = useMemo(() => {
    const scopeFilter = (t: Transaction) =>
      selectedWalletFilter === "all" || t.walletId === selectedWalletFilter;

    const currentExpenses = transactions.filter(
      (t) =>
        t.type === "expense" &&
        t.date.startsWith(selectedMonth) &&
        scopeFilter(t)
    );
    const prevExpenses = transactions.filter(
      (t) =>
        t.type === "expense" &&
        t.date.startsWith(prevMonthKey) &&
        scopeFilter(t)
    );

    const totalCurrentExpense = currentExpenses.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalPrevExpense = prevExpenses.reduce((sum, t) => sum + t.amount, 0);

    const merchantMap: Record<
      string,
      {
        merchant: string;
        count: number;
        total: number;
        prevTotal: number;
        category: string;
      }
    > = {};

    currentExpenses.forEach((t) => {
      const key = t.merchant.trim().toLowerCase();
      if (!merchantMap[key]) {
        merchantMap[key] = {
          merchant: t.merchant.trim(),
          count: 0,
          total: 0,
          prevTotal: 0,
          category: getCategoryLabel(t.category, language, customCategories),
        };
      }
      merchantMap[key].count += 1;
      merchantMap[key].total += t.amount;
    });

    prevExpenses.forEach((t) => {
      const key = t.merchant.trim().toLowerCase();
      if (merchantMap[key]) {
        merchantMap[key].prevTotal += t.amount;
      }
    });

    const topMerchants = Object.values(merchantMap)
      .sort((a, b) => {
        // Prioritize recurring merchants (count >= 2) and highest spend
        const aScore = a.count >= 2 ? a.total * 1.35 : a.total;
        const bScore = b.count >= 2 ? b.total * 1.35 : b.total;
        return bScore - aScore;
      })
      .slice(0, 6)
      .map((m) => ({
        merchant: m.merchant,
        visitsThisMonth: m.count,
        totalThisMonthIDR: m.total,
        avgPerVisitIDR: Math.round(m.total / Math.max(1, m.count)),
        lastMonthTotalIDR: m.prevTotal,
        category: m.category,
      }));

    const catMap: Record<string, number> = {};
    currentExpenses.forEach((t) => {
      const label = getCategoryLabel(t.category, language, customCategories);
      catMap[label] = (catMap[label] ?? 0) + t.amount;
    });

    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, totalIDR]) => ({ category, totalIDR }));

    const recurringSpotlight = topMerchants.find((m) => m.visitsThisMonth >= 2);

    return {
      hasExpenses: currentExpenses.length > 0,
      expenseCount: currentExpenses.length,
      totalCurrentExpense,
      totalPrevExpense,
      recurringSpotlight,
      input: {
        monthLabel: formatMonthLabel(selectedMonth, language),
        prevMonthLabel: formatMonthLabel(prevMonthKey, language),
        totalCurrentExpenseIDR: totalCurrentExpense,
        totalPrevExpenseIDR: totalPrevExpense,
        avgTransactionIDR:
          currentExpenses.length > 0
            ? Math.round(totalCurrentExpense / currentExpenses.length)
            : 0,
        topMerchants,
        topCategories,
      },
    };
  }, [
    transactions,
    customCategories,
    selectedMonth,
    prevMonthKey,
    selectedWalletFilter,
    language,
  ]);

  const cacheKey = `${selectedMonth}|${selectedWalletFilter}|${language}|${analysisPayload.expenseCount}|${analysisPayload.totalCurrentExpense}|${analysisPayload.totalPrevExpense}`;

  const fetchTip = useCallback(
    async (forceRefresh = false) => {
      if (!analysisPayload.hasExpenses) {
        setTipData(null);
        setErrorMsg(null);
        return;
      }

      if (!forceRefresh && tipCache.has(cacheKey)) {
        setTipData(tipCache.get(cacheKey)!);
        setErrorMsg(null);
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/spending-tip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysisInput: analysisPayload.input,
            language,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error ||
              (language === "en"
                ? "Unable to generate AI spending trend tip."
                : "Gagal memuat analisis tren pengeluaran AI.")
          );
        }
        tipCache.set(cacheKey, data as SpendingTipResult);
        setTipData(data as SpendingTipResult);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : language === "en"
              ? "AI analysis is currently unavailable."
              : "Analisis AI belum tersedia saat ini."
        );
      } finally {
        setLoading(false);
      }
    },
    [analysisPayload, cacheKey, language]
  );

  useEffect(() => {
    void fetchTip(false);
  }, [fetchTip]);

  const badgeTone =
    tipData?.impactType === "positive"
      ? "text-emerald-700 dark:text-emerald-400"
      : tipData?.impactType === "warning"
        ? "text-rose-700 dark:text-rose-400"
        : "text-purple-700 dark:text-purple-300";

  return (
    <section
      aria-label={
        language === "en" ? "AI Spending Trend Tip" : "Tips Tren Pengeluaran AI"
      }
      className="glass-panel rounded-3xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3E8FF] to-[#FFE1EE] text-purple-700 shadow-xs dark:from-purple-950/60 dark:to-pink-950/60 dark:text-purple-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-[#241F35] dark:text-slate-100">
              {language === "en"
                ? "Spending Trend Tip"
                : "Tips Tren Pengeluaran"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "en"
                ? "AI merchant & pattern check for this month"
                : "Analisis AI pola belanja & merchant rutin bulan ini"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchTip(true)}
          disabled={loading || !analysisPayload.hasExpenses}
          className="glass-soft inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#241F35] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 dark:text-slate-200 whitespace-nowrap cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>
            {loading
              ? language === "en"
                ? "Analyzing..."
                : "Menganalisis..."
              : language === "en"
                ? "Refresh"
                : "Analisis Ulang"}
          </span>
        </button>
      </div>

      {!analysisPayload.hasExpenses ? (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {language === "en"
            ? "Record at least one expense this month so Mucuw AI can spot recurring merchant trends."
            : "Catat minimal satu pengeluaran bulan ini supaya Mucuw AI bisa mendeteksi pola merchant berulang."}
        </p>
      ) : loading && !tipData ? (
        <div className="mt-4 space-y-2.5">
          <div className="h-4 w-2/5 rounded-lg bg-slate-200/70 dark:bg-slate-800" />
          <div className="h-3.5 w-full rounded-lg bg-slate-200/50 dark:bg-slate-800/70" />
          <div className="h-3.5 w-4/5 rounded-lg bg-slate-200/50 dark:bg-slate-800/70" />
        </div>
      ) : errorMsg ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {analysisPayload.recurringSpotlight && (
            <span className="font-mono text-[11px] tabular-nums text-rose-700 dark:text-rose-300">
              {analysisPayload.recurringSpotlight.merchant} ·{" "}
              {analysisPayload.recurringSpotlight.visitsThisMonth}x (
              {formatCurrency(
                analysisPayload.recurringSpotlight.totalThisMonthIDR,
                currency,
                privacyMode
              )}
              )
            </span>
          )}
        </div>
      ) : tipData ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${badgeTone}`}>
              {tipData.impactType === "positive" ? (
                <TrendingDown className="h-4 w-4 shrink-0" />
              ) : (
                <TrendingUp className="h-4 w-4 shrink-0" />
              )}
              <span>{tipData.headline}</span>
            </p>

            {tipData.estimatedMonthlySaving > 0 && (
              <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {language === "en" ? "Potential save" : "Potensi hemat"}{" "}
                {formatCurrency(
                  tipData.estimatedMonthlySaving,
                  currency,
                  privacyMode
                )}
                {language === "en" ? "/mo" : "/bln"}
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {tipData.tip}
          </p>

          {(tipData.focusMerchant || analysisPayload.recurringSpotlight) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/60 pt-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-400">
              <Store className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-[#241F35] dark:text-slate-200">
                {tipData.focusMerchant ||
                  analysisPayload.recurringSpotlight?.merchant}
              </span>
              {analysisPayload.recurringSpotlight && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {analysisPayload.recurringSpotlight.visitsThisMonth}x{" "}
                    {language === "en" ? "visits" : "transaksi"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(
                      analysisPayload.recurringSpotlight.totalThisMonthIDR,
                      currency,
                      privacyMode
                    )}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
