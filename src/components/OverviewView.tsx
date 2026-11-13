import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Budget,
  Currency,
  CustomCategory,
  DreamGoal,
  Language,
  SavingJar,
  SpendingChallenge,
  TabId,
  Transaction,
  TransactionType,
  Wallet,
  WidgetShape,
  WidgetTheme,
} from "../types/finance";
import {
  formatCurrency,
  formatMonthLabel,
  formatShortDate,
  getCategoryColor,
  getCategoryLabel,
} from "../utils/format";
import { Badges } from "./Badges";
import { CategoryIcon } from "./CategoryIcon";
import { MascotBanner } from "./MascotBanner";
import { SpendingTrendTip } from "./SpendingTrendTip";

function getPreviousMonthKey(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return monthKey;
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

function getDaysInMonthKey(monthKey: string): number {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return 30;
  return new Date(y, m, 0).getDate();
}

function formatAxisCompact(val: number, currency: Currency, masked: boolean): string {
  if (masked) return "•••";
  if (currency === "USD") {
    const usd = val / 15850;
    return `$${Math.round(usd)}`;
  }
  if (val === 0) return "0";
  if (val >= 1_000_000) {
    const jt = val / 1_000_000;
    return `${Number.isInteger(jt) ? jt : jt.toFixed(1)}jt`;
  }
  if (val >= 1000) {
    return `${Math.round(val / 1000)}rb`;
  }
  return String(val);
}

interface OverviewViewProps {
  userName: string;
  wallets: Wallet[];
  selectedWalletFilter: string;
  onSelectWalletFilter: (walletId: string) => void;
  transactions: Transaction[];
  budgets: Budget[];
  dreams: DreamGoal[];
  jars?: SavingJar[];
  challenges: SpendingChallenge[];
  customCategories: CustomCategory[];
  selectedMonth: string;
  currency: Currency;
  language: Language;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  widgetTheme: WidgetTheme;
  widgetShape: WidgetShape;
  companionName: string;
  companionAvatarUrl?: string;
  onUpdateWidget: (patch: {
    widgetTheme?: WidgetTheme;
    widgetShape?: WidgetShape;
    companionName?: string;
    companionAvatarUrl?: string;
  }) => void;
  onNavigate: (tab: TabId) => void;
  onOpenNewTx: (defaultType?: TransactionType) => void;
  onOpenProfile: () => void;
}

export function OverviewView({
  userName,
  wallets,
  selectedWalletFilter,
  onSelectWalletFilter,
  transactions,
  budgets,
  dreams,
  jars = [],
  challenges,
  customCategories,
  selectedMonth,
  currency,
  language,
  privacyMode,
  onTogglePrivacy,
  widgetTheme,
  widgetShape,
  companionName,
  companionAvatarUrl,
  onUpdateWidget,
  onNavigate,
  onOpenNewTx,
  onOpenProfile,
}: OverviewViewProps) {
  const [trendMode, setTrendMode] = useState<"cumulative" | "daily">("cumulative");
  const prevMonthKey = useMemo(() => getPreviousMonthKey(selectedMonth), [selectedMonth]);

  const monthlyTxs = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedMonth]
  );

  const prevMonthlyTxs = useMemo(
    () => transactions.filter((t) => t.date.startsWith(prevMonthKey)),
    [transactions, prevMonthKey]
  );

  const scopedTxs = useMemo(
    () =>
      selectedWalletFilter === "all"
        ? monthlyTxs
        : monthlyTxs.filter((t) => t.walletId === selectedWalletFilter),
    [monthlyTxs, selectedWalletFilter]
  );

  const totalNetWorth = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  const scopedBalance = useMemo(() => {
    if (selectedWalletFilter === "all") return totalNetWorth;
    return wallets.find((w) => w.id === selectedWalletFilter)?.balance ?? 0;
  }, [wallets, selectedWalletFilter, totalNetWorth]);

  const scopedIncome = useMemo(
    () =>
      scopedTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [scopedTxs]
  );

  const scopedExpense = useMemo(
    () =>
      scopedTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [scopedTxs]
  );

  const monthlyIncome = useMemo(
    () =>
      monthlyTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthlyTxs]
  );

  const monthlyExpense = useMemo(
    () =>
      monthlyTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthlyTxs]
  );

  const totalMonthlyBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + b.monthlyLimit, 0),
    [budgets]
  );

  const budgetRatio = totalMonthlyBudget > 0 ? monthlyExpense / totalMonthlyBudget : 0;
  const remainingBudget = totalMonthlyBudget - monthlyExpense;
  const daysLeftInMonth = 17;
  const dailySafeLimit = Math.max(0, remainingBudget / daysLeftInMonth);

  const savingsRate =
    monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)
      : 0;

  const streakDays = useMemo(
    () => challenges.reduce((max, c) => Math.max(max, c.completedDays), 0),
    [challenges]
  );

  const categorySpendMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyTxs
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    return map;
  }, [monthlyTxs]);

  const donutSegments = useMemo(() => {
    const entries = Object.entries(categorySpendMap)
      .map(([cat, amount]) => ({
        category: cat,
        label: getCategoryLabel(cat, language, customCategories),
        color: getCategoryColor(cat, customCategories),
        amount,
      }))
      .filter((e) => e.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return {
      total,
      radius,
      circumference,
      items: entries.map((entry) => {
        const ratio = total > 0 ? entry.amount / total : 0;
        const dash = ratio * circumference;
        const offset = -cumulative;
        cumulative += dash;
        return {
          ...entry,
          pct: Math.round(ratio * 100),
          dash,
          offset,
        };
      }),
    };
  }, [categorySpendMap, language, customCategories]);

  const dailySeries = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};
    scopedTxs.forEach((t) => {
      if (!grouped[t.date]) grouped[t.date] = { income: 0, expense: 0 };
      if (t.type === "income") grouped[t.date].income += t.amount;
      else grouped[t.date].expense += t.amount;
    });
    const dates = Object.keys(grouped).sort().slice(-7);
    return dates.map((d) => ({
      date: d,
      label: d.slice(8, 10),
      income: grouped[d].income,
      expense: grouped[d].expense,
    }));
  }, [scopedTxs]);

  const maxDailyChart = useMemo(() => {
    const vals = dailySeries.flatMap((d) => [d.income, d.expense]);
    return Math.max(100000, ...vals);
  }, [dailySeries]);

  const { trendData, currentMonthSpendTotal, prevMonthSpendTotal, trendDeltaPct } = useMemo(() => {
    const curDays = getDaysInMonthKey(selectedMonth);
    const prevDays = getDaysInMonthKey(prevMonthKey);
    const maxDays = Math.max(curDays, prevDays);

    const curDaily: Record<number, number> = {};
    const prevDaily: Record<number, number> = {};

    const curScoped =
      selectedWalletFilter === "all"
        ? monthlyTxs
        : monthlyTxs.filter((t) => t.walletId === selectedWalletFilter);
    const prevScoped =
      selectedWalletFilter === "all"
        ? prevMonthlyTxs
        : prevMonthlyTxs.filter((t) => t.walletId === selectedWalletFilter);

    curScoped
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const day = Number(t.date.slice(8, 10));
        if (day >= 1 && day <= 31) {
          curDaily[day] = (curDaily[day] ?? 0) + t.amount;
        }
      });

    prevScoped
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const day = Number(t.date.slice(8, 10));
        if (day >= 1 && day <= 31) {
          prevDaily[day] = (prevDaily[day] ?? 0) + t.amount;
        }
      });

    let curCum = 0;
    let prevCum = 0;
    const rows: Array<{
      day: number;
      dayLabel: string;
      current: number;
      previous: number;
    }> = [];

    for (let d = 1; d <= maxDays; d += 1) {
      const cAmt = curDaily[d] ?? 0;
      const pAmt = prevDaily[d] ?? 0;
      curCum += cAmt;
      prevCum += pAmt;
      rows.push({
        day: d,
        dayLabel: `${d}`,
        current: trendMode === "cumulative" ? curCum : cAmt,
        previous: trendMode === "cumulative" ? prevCum : pAmt,
      });
    }

    const deltaPct =
      prevCum > 0 ? Math.round(((curCum - prevCum) / prevCum) * 100) : 0;

    return {
      trendData: rows,
      currentMonthSpendTotal: curCum,
      prevMonthSpendTotal: prevCum,
      trendDeltaPct: deltaPct,
    };
  }, [monthlyTxs, prevMonthlyTxs, selectedMonth, prevMonthKey, selectedWalletFilter, trendMode]);

  const walletMap = useMemo(() => {
    const m: Record<string, string> = {};
    wallets.forEach((w) => {
      m[w.id] = w.name;
    });
    return m;
  }, [wallets]);

  const activeDream = dreams[0];
  const activeChallenge = challenges.find((c) => c.active) ?? challenges[0];

  const cuanAchievements = [
    {
      label: language === "en" ? "Positive Cashflow" : "Cashflow Surplus",
      achieved: monthlyIncome > monthlyExpense,
    },
    {
      label: language === "en" ? "AI Receipt Logger" : "Rajin Scan Struk",
      achieved: monthlyTxs.some((t) => t.source === "ai-scan"),
    },
    {
      label: language === "en" ? "Challenge Streak" : "Streak Hemat >= 3 Hari",
      achieved: streakDays >= 3,
    },
  ];

  return (
    <div className="space-y-6">
      <MascotBanner
        userName={userName}
        wallets={wallets}
        selectedWalletFilter={selectedWalletFilter}
        onSelectWalletFilter={onSelectWalletFilter}
        totalBalance={scopedBalance}
        scopedIncome={scopedIncome}
        scopedExpense={scopedExpense}
        budgetRatio={budgetRatio}
        dailySafeLimit={dailySafeLimit}
        remainingBudget={remainingBudget}
        savingsRate={savingsRate}
        streakDays={streakDays}
        currency={currency}
        language={language}
        privacyMode={privacyMode}
        onTogglePrivacy={onTogglePrivacy}
        widgetTheme={widgetTheme}
        widgetShape={widgetShape}
        companionName={companionName}
        companionAvatarUrl={companionAvatarUrl}
        onUpdateWidget={onUpdateWidget}
        onQuickLog={(txType) => onOpenNewTx(txType)}
        onOpenScanner={() => onNavigate("scanner")}
        onOpenTransfer={() => onNavigate("wallets")}
        onOpenAiInsights={() => onNavigate("wallets")}
        onOpenProfile={onOpenProfile}
      />

      {/* 4-Column Frosted Glass KPI Strip */}
      <section
        aria-label="Ringkasan Metrik Utama"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {language === "en" ? "Total Net Balance" : "Total Saldo Seluruh Dompet"}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(totalNetWorth, currency, privacyMode)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {wallets.length} {language === "en" ? "active accounts" : "dompet aktif"}
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {language === "en" ? "Monthly Income" : "Pemasukan Bulan Ini"}
            </p>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatCurrency(monthlyIncome, currency, privacyMode)}
          </p>
          <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {language === "en" ? "Savings rate" : "Rasio nabung"} {savingsRate}%
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {language === "en" ? "Monthly Expense" : "Pengeluaran Bulan Ini"}
            </p>
            <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(monthlyExpense, currency, privacyMode)}
          </p>
          <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {language === "en" ? "Of budget" : "Dari batas"}{" "}
            {formatCurrency(totalMonthlyBudget, currency, privacyMode)}
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {language === "en" ? "Safe Daily Limit" : "Jatah Aman Harian"}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatCurrency(dailySafeLimit, currency, privacyMode)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {remainingBudget >= 0
              ? language === "en"
                ? "Under monthly cap"
                : "Masih di bawah batas bulanan"
              : language === "en"
                ? "Monthly limit exceeded"
                : "Melebihi batas bulanan"}
          </p>
        </div>
      </section>

      {/* Analytical Split: Donut Chart + Daily Cashflow + Category Budgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* SVG Donut Chart (Mochi "Pengeluaran bulan ini") */}
        <section className="glass-panel rounded-3xl p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {language === "en"
                  ? "This Month's Spending"
                  : "Pengeluaran Bulan Ini"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Category share breakdown"
                  : "Porsi pengeluaran per kategori"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("wallets")}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap cursor-pointer"
            >
              <span>{language === "en" ? "Details" : "Detail"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {donutSegments.total === 0 ? (
            <div className="mt-8 flex h-44 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 dark:border-slate-800">
              {language === "en"
                ? "No expenses recorded this month."
                : "Belum ada pengeluaran bulan ini."}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
              <div className="relative h-40 w-40 shrink-0">
                <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r={donutSegments.radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="22"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  {donutSegments.items.map((seg) => (
                    <circle
                      key={seg.category}
                      cx="80"
                      cy="80"
                      r={donutSegments.radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="22"
                      strokeDasharray={`${seg.dash} ${donutSegments.circumference}`}
                      strokeDashoffset={seg.offset}
                    />
                  ))}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Total
                  </span>
                  <span className="mt-0.5 font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(donutSegments.total, currency, privacyMode)}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2.5 w-full">
                {donutSegments.items.slice(0, 5).map((seg) => (
                  <div
                    key={seg.category}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {seg.label}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {seg.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Daily Cashflow Bar Chart */}
        <section className="glass-panel rounded-3xl p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {language === "en"
                  ? "Recent Activity Cashflow"
                  : "Arus Kas Aktivitas Terakhir"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Income vs Expense across active days"
                  : "Perbandingan pemasukan dan pengeluaran harian"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                {language === "en" ? "Income" : "Masuk"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-800 dark:bg-slate-300" />
                {language === "en" ? "Expense" : "Keluar"}
              </span>
            </div>
          </div>

          {dailySeries.length === 0 ? (
            <div className="mt-8 flex h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-center dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "No transactions recorded for this view."
                  : "Belum ada transaksi pada dompet atau bulan ini."}
              </p>
              <button
                type="button"
                onClick={() => onOpenNewTx("expense")}
                className="mt-3 text-sm font-medium text-emerald-600 hover:underline cursor-pointer"
              >
                {language === "en" ? "Log first entry" : "Catat transaksi pertama"}
              </button>
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex h-44 items-end justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                {dailySeries.map((day) => {
                  const incHeight = Math.max(
                    day.income > 0 ? 6 : 0,
                    Math.round((day.income / maxDailyChart) * 100)
                  );
                  const expHeight = Math.max(
                    day.expense > 0 ? 6 : 0,
                    Math.round((day.expense / maxDailyChart) * 100)
                  );
                  return (
                    <div
                      key={day.date}
                      className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                      title={
                        privacyMode
                          ? formatShortDate(day.date, language)
                          : `${formatShortDate(day.date, language)}: +${formatCurrency(day.income, currency)} / -${formatCurrency(day.expense, currency)}`
                      }
                    >
                      <div className="flex h-full w-full max-w-[52px] items-end justify-center gap-1.5">
                        <div
                          className="w-1/2 rounded-t-sm bg-emerald-500 transition-opacity group-hover:opacity-85"
                          style={{ height: `${incHeight}%` }}
                        />
                        <div
                          className="w-1/2 rounded-t-sm bg-slate-800 transition-opacity group-hover:opacity-85 dark:bg-slate-300"
                          style={{ height: `${expHeight}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 flex justify-between gap-3">
                {dailySeries.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 text-center font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400"
                  >
                    Tgl {day.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* AI Spending Trend Tip */}
      <SpendingTrendTip
        transactions={transactions}
        customCategories={customCategories}
        selectedMonth={selectedMonth}
        prevMonthKey={prevMonthKey}
        selectedWalletFilter={selectedWalletFilter}
        currency={currency}
        language={language}
        privacyMode={privacyMode}
      />

      {/* Recharts Monthly Spending Trend vs Previous Month */}
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col gap-3 border-b border-white/60 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {language === "en"
                  ? "Monthly Spending Trend vs Previous Month"
                  : "Tren Pengeluaran Bulanan vs Bulan Lalu"}
              </h3>
              {prevMonthSpendTotal > 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    trendDeltaPct <= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {trendDeltaPct <= 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5" />
                  )}
                  <span className="font-mono tabular-nums">
                    {trendDeltaPct > 0 ? `+${trendDeltaPct}%` : `${trendDeltaPct}%`}
                  </span>
                  <span>
                    {trendDeltaPct <= 0
                      ? language === "en"
                        ? "lower"
                        : "lebih hemat"
                      : language === "en"
                        ? "higher"
                        : "lebih tinggi"}
                  </span>
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{formatMonthLabel(selectedMonth, language)}: </span>
              <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                {formatCurrency(currentMonthSpendTotal, currency, privacyMode)}
              </span>
              <span aria-hidden="true"> · </span>
              <span>{formatMonthLabel(prevMonthKey, language)}: </span>
              <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {formatCurrency(prevMonthSpendTotal, currency, privacyMode)}
              </span>
            </p>
          </div>

          <div className="glass-soft flex items-center gap-1 self-start rounded-xl p-1">
            <button
              type="button"
              onClick={() => setTrendMode("cumulative")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                trendMode === "cumulative"
                  ? "bg-[#241F35] text-white shadow-xs dark:bg-emerald-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              {language === "en" ? "Cumulative" : "Kumulatif"}
            </button>
            <button
              type="button"
              onClick={() => setTrendMode("daily")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                trendMode === "daily"
                  ? "bg-[#241F35] text-white shadow-xs dark:bg-emerald-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              {language === "en" ? "Daily" : "Harian"}
            </button>
          </div>
        </div>

        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="rgba(148, 163, 184, 0.25)"
                vertical={false}
              />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                interval={2}
                tickFormatter={(val) => `${language === "en" ? "D" : "Tgl "}${val}`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(val: number) =>
                  formatAxisCompact(val, currency, privacyMode)
                }
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  return (
                    <div className="glass-modal rounded-2xl px-3.5 py-2.5 text-xs shadow-lg">
                      <p className="font-display font-semibold text-[#241F35] dark:text-slate-100">
                        {language === "en" ? `Day ${label}` : `Tanggal ${label}`}
                      </p>
                      <div className="mt-1.5 space-y-1">
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-4"
                          >
                            <span
                              className="font-medium"
                              style={{ color: entry.color }}
                            >
                              {entry.name}
                            </span>
                            <span className="font-mono font-semibold tabular-nums text-[#241F35] dark:text-slate-100">
                              {formatCurrency(
                                Number(entry.value ?? 0),
                                currency,
                                privacyMode
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Line
                type="monotone"
                dataKey="current"
                name={formatMonthLabel(selectedMonth, language)}
                stroke="#10B981"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#10B981", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="previous"
                name={formatMonthLabel(prevMonthKey, language)}
                stroke="#A78BFA"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 4, fill: "#A78BFA", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Category Budget Progress + Recent Transactions + Right Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="glass-panel rounded-3xl p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {language === "en" ? "Recent Transactions" : "Transaksi Terbaru"}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("transactions")}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap cursor-pointer"
            >
              <span>{language === "en" ? "View all" : "Lihat semua"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-white/60 dark:divide-white/10">
            {scopedTxs.slice(0, 6).map((tx) => {
              const catColor = getCategoryColor(tx.category, customCategories);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="glass-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200"
                      style={{ color: catColor }}
                    >
                      <CategoryIcon category={tx.category} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {tx.merchant}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {getCategoryLabel(tx.category, language, customCategories)} ·{" "}
                        {walletMap[tx.walletId] ?? "Dompet"} ·{" "}
                        {formatShortDate(tx.date, language)}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 font-mono text-sm font-medium tabular-nums ${
                      tx.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount, currency, privacyMode)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-5">
          {/* Category Budget Progress */}
          <div className="glass-panel rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {language === "en" ? "Top Category Budgets" : "Pantauan Budget Kategori"}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("budgets")}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap cursor-pointer"
              >
                <span>{language === "en" ? "Manage" : "Atur"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {budgets.slice(0, 4).map((b) => {
                const spent = categorySpendMap[b.category] ?? 0;
                const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
                const clamped = Math.min(100, pct);
                const isOver = pct > 100;
                const isWarn = pct >= 80 && !isOver;

                return (
                  <div key={b.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {getCategoryLabel(b.category, language, customCategories)}
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {formatCurrency(spent, currency, privacyMode)} /{" "}
                        {formatCurrency(b.monthlyLimit, currency, privacyMode)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver
                            ? "bg-rose-600"
                            : isWarn
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${clamped}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cuan Performance Card */}
          <div className="glass-panel rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Cuan Performance</span>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {savingsRate}% {language === "en" ? "saved" : "tertabung"}
              </span>
            </div>
            <div className="mt-3 divide-y divide-white/60 dark:divide-white/10">
              {cuanAchievements.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <span
                    className={
                      item.achieved
                        ? "font-medium text-emerald-700 dark:text-emerald-400"
                        : "text-slate-400"
                    }
                  >
                    {item.achieved
                      ? language === "en"
                        ? "Unlocked"
                        : "Tercapai"
                      : language === "en"
                        ? "In progress"
                        : "Proses"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dream Sticky Note Preview */}
          {activeDream && (
            <div className="rounded-3xl border border-white/85 bg-[#FEFCE8]/75 p-5 shadow-[0_10px_28px_-12px_rgba(42,31,74,0.1)] backdrop-blur-xl dark:border-amber-800/40 dark:bg-[#1E1B10]/75">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                  <Target className="h-4 w-4" />
                  <span>{language === "en" ? "Dream Sticky" : "Catatan Impian"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("dreams")}
                  className="text-xs font-medium text-amber-900 hover:underline dark:text-amber-300 whitespace-nowrap cursor-pointer"
                >
                  {language === "en" ? "Open Board" : "Buka Papan"}
                </button>
              </div>
              <h4 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {activeDream.title}
              </h4>
              <div className="mt-2.5 flex items-baseline justify-between font-mono text-xs tabular-nums">
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  {formatCurrency(activeDream.currentAmount, currency, privacyMode)}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  / {formatCurrency(activeDream.targetAmount, currency, privacyMode)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200/70 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (activeDream.currentAmount / activeDream.targetAmount) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {activeChallenge && (
            <div className="glass-panel rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {language === "en" ? "Active Challenge" : "Tantangan Hemat Aktif"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("budgets")}
                  className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap cursor-pointer"
                >
                  Check-in
                </button>
              </div>
              <h4 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {activeChallenge.title}
              </h4>
              <div className="mt-2.5 flex items-center justify-between font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                <span>
                  {activeChallenge.completedDays} / {activeChallenge.targetDays}{" "}
                  {language === "en" ? "days" : "hari"}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  +{formatCurrency(activeChallenge.estimatedSaving, currency, privacyMode)}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Achievement Badges (Transaction Frequency & Savings Milestones) */}
      <Badges
        transactions={transactions}
        wallets={wallets}
        dreams={dreams}
        jars={jars}
        selectedMonth={selectedMonth}
        currency={currency}
        language={language}
        privacyMode={privacyMode}
        onNavigate={onNavigate}
      />
    </div>
  );
}
