import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Currency,
  CustomCategory,
  Language,
  RecurringTransactionRule,
  Transaction,
  TransactionType,
  Wallet,
} from "../types/finance";
import {
  formatCurrency,
  formatMonthLabel,
  getCategoryColor,
  getCategoryLabel,
} from "../utils/format";
import { CategoryIcon } from "./CategoryIcon";

interface CalendarViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  recurringRules?: RecurringTransactionRule[];
  customCategories?: CustomCategory[];
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
  currency: Currency;
  language: Language;
  privacyMode: boolean;
  onDeleteTransaction: (id: string) => void;
  onOpenNewTx: (defaultType?: TransactionType, defaultDate?: string) => void;
}

function shiftMonthKey(monthKey: string, delta: number): string {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr) || 2026;
  const m = Number(mStr) || 11;
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatCompactAmount(val: number, currency: Currency, masked: boolean): string {
  if (masked) return "•••";
  if (currency === "USD") {
    const usd = val / 15850;
    return `$${usd >= 10 ? Math.round(usd) : usd.toFixed(1)}`;
  }
  if (val >= 1_000_000) {
    const jt = val / 1_000_000;
    return `${Number.isInteger(jt) ? jt : jt.toFixed(1)}jt`;
  }
  if (val >= 1000) {
    return `${Math.round(val / 1000)}rb`;
  }
  return String(val);
}

function formatFullDateLabel(dateStr: string, language: Language): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
}

export function CalendarView({
  transactions,
  wallets,
  recurringRules = [],
  customCategories = [],
  selectedMonth,
  onSelectMonth,
  currency,
  language,
  privacyMode,
  onDeleteTransaction,
  onOpenNewTx,
}: CalendarViewProps) {
  const [walletFilter, setWalletFilter] = useState<string>("all");

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  }, []);

  const walletMap = useMemo(() => {
    const map: Record<string, string> = {};
    wallets.forEach((w) => {
      map[w.id] = w.name;
    });
    return map;
  }, [wallets]);

  const monthMeta = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split("-");
    const year = Number(yStr) || 2026;
    const month = Number(mStr) || 11;
    const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month, 0).getDate();
    return { year, month, firstWeekday, daysInMonth };
  }, [selectedMonth]);

  const monthTxs = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(selectedMonth))
      .filter((t) => (walletFilter === "all" ? true : t.walletId === walletFilter))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, walletFilter]);

  const byDate = useMemo(() => {
    const map: Record<
      string,
      { income: number; expense: number; items: Transaction[] }
    > = {};
    monthTxs.forEach((tx) => {
      if (!map[tx.date]) {
        map[tx.date] = { income: 0, expense: 0, items: [] };
      }
      if (tx.type === "income") map[tx.date].income += tx.amount;
      else map[tx.date].expense += tx.amount;
      map[tx.date].items.push(tx);
    });
    return map;
  }, [monthTxs]);

  const getInitialSelectedDate = () => {
    if (todayStr.startsWith(selectedMonth)) return todayStr;
    if (monthTxs.length > 0) return monthTxs[0].date;
    return `${selectedMonth}-01`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialSelectedDate);

  useEffect(() => {
    if (!selectedDate.startsWith(selectedMonth)) {
      if (todayStr.startsWith(selectedMonth)) {
        setSelectedDate(todayStr);
      } else if (monthTxs.length > 0) {
        setSelectedDate(monthTxs[0].date);
      } else {
        setSelectedDate(`${selectedMonth}-01`);
      }
    }
  }, [selectedMonth, selectedDate, todayStr, monthTxs]);

  const monthlySummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    monthTxs.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });
    return {
      income,
      expense,
      net: income - expense,
      activeDays: Object.keys(byDate).length,
    };
  }, [monthTxs, byDate]);

  const selectedDayData = byDate[selectedDate] ?? {
    income: 0,
    expense: 0,
    items: [],
  };
  const selectedDayNum = Number(selectedDate.slice(8, 10)) || 1;

  const recurringOnSelectedDay = useMemo(() => {
    return recurringRules.filter((r) => {
      if (!r.active) return false;
      const effDay = Math.min(Math.max(1, r.dayOfMonth), monthMeta.daysInMonth);
      return effDay === selectedDayNum;
    });
  }, [recurringRules, monthMeta.daysInMonth, selectedDayNum]);

  const recurringDaySet = useMemo(() => {
    const set = new Set<number>();
    recurringRules.forEach((r) => {
      if (!r.active) return;
      set.add(Math.min(Math.max(1, r.dayOfMonth), monthMeta.daysInMonth));
    });
    return set;
  }, [recurringRules, monthMeta.daysInMonth]);

  const weekdayLabels =
    language === "en"
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < monthMeta.firstWeekday; i += 1) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= monthMeta.daysInMonth; d += 1) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  }, [monthMeta, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Calendar Header & Month Summary */}
      <section className="glass-panel rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/60 pb-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CalendarDays className="h-4 w-4" />
              <span>{language === "en" ? "Activity Calendar" : "Kalender Transaksi"}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {monthlySummary.activeDays}{" "}
                {language === "en" ? "active days" : "hari aktif"}
              </span>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatMonthLabel(selectedMonth, language)}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              aria-label={language === "en" ? "Filter Wallet" : "Filter Dompet"}
              className="glass-soft rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
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

            <div className="glass-soft flex items-center gap-1 rounded-xl p-1">
              <button
                type="button"
                onClick={() => onSelectMonth(shiftMonthKey(selectedMonth, -1))}
                aria-label={language === "en" ? "Previous month" : "Bulan sebelumnya"}
                className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectMonth(todayStr.slice(0, 7))}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-white/70 dark:text-slate-200 dark:hover:bg-white/10 whitespace-nowrap cursor-pointer"
              >
                {language === "en" ? "Today" : "Bulan Ini"}
              </button>
              <button
                type="button"
                onClick={() => onSelectMonth(shiftMonthKey(selectedMonth, 1))}
                aria-label={language === "en" ? "Next month" : "Bulan berikutnya"}
                className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Unboxed Monthly Flow Metrics + Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>
                {language === "en" ? "In:" : "Masuk:"}{" "}
                <strong>{formatCurrency(monthlySummary.income, currency, privacyMode)}</strong>
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>
                {language === "en" ? "Out:" : "Keluar:"}{" "}
                <strong>{formatCurrency(monthlySummary.expense, currency, privacyMode)}</strong>
              </span>
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {language === "en" ? "Net:" : "Selisih:"}{" "}
              <strong>
                {monthlySummary.net >= 0 ? "+" : ""}
                {formatCurrency(monthlySummary.net, currency, privacyMode)}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {language === "en" ? "Income" : "Pemasukan"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              {language === "en" ? "Expense" : "Pengeluaran"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              {language === "en" ? "Recurring" : "Jadwal rutin"}
            </span>
          </div>
        </div>
      </section>

      {/* Split Layout: 7-Column Calendar + Selected Date Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Monthly Grid */}
        <section className="glass-panel rounded-3xl p-4 sm:p-6 lg:col-span-7">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {weekdayLabels.map((dayName) => (
              <div key={dayName} className="py-1.5">
                {dayName}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell, index) => {
              if (!cell.day || !cell.dateStr) {
                return (
                  <div
                    key={`empty-${index}`}
                    aria-hidden="true"
                    className="h-16 rounded-2xl sm:h-20"
                  />
                );
              }

              const dayInfo = byDate[cell.dateStr];
              const hasTx = Boolean(dayInfo && dayInfo.items.length > 0);
              const hasIncome = Boolean(dayInfo && dayInfo.income > 0);
              const hasExpense = Boolean(dayInfo && dayInfo.expense > 0);
              const hasRecurring = recurringDaySet.has(cell.day);
              const isSelected = selectedDate === cell.dateStr;
              const isToday = todayStr === cell.dateStr;

              const previewLabel = hasExpense
                ? `-${formatCompactAmount(dayInfo.expense, currency, privacyMode)}`
                : hasIncome
                  ? `+${formatCompactAmount(dayInfo.income, currency, privacyMode)}`
                  : null;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr!)}
                  aria-pressed={isSelected}
                  aria-label={`${formatFullDateLabel(cell.dateStr, language)}${
                    hasTx
                      ? `, ${dayInfo.items.length} ${
                          language === "en" ? "transactions" : "transaksi"
                        }`
                      : ""
                  }`}
                  className={`group relative flex h-16 flex-col justify-between rounded-2xl border p-2 text-left transition-all cursor-pointer sm:h-20 sm:p-2.5 ${
                    isSelected
                      ? "border-[#241F35] bg-white/95 shadow-sm ring-2 ring-[#241F35]/15 dark:border-emerald-400 dark:bg-emerald-950/45 dark:ring-emerald-400/20"
                      : hasTx
                        ? "glass-soft hover:border-emerald-400/70 hover:bg-white/80 dark:hover:bg-white/10"
                        : "border-transparent bg-white/25 hover:border-white/70 hover:bg-white/55 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        isToday
                          ? "rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] text-white"
                          : isSelected
                            ? "text-[#241F35] dark:text-emerald-300"
                            : hasTx
                              ? "text-slate-900 dark:text-slate-100"
                              : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {cell.day}
                    </span>

                    {hasTx && (
                      <span className="hidden font-mono text-[10px] tabular-nums text-slate-400 sm:inline">
                        {dayInfo.items.length}×
                      </span>
                    )}
                  </div>

                  {/* Transaction Activity Indicators & Compact Daily Amount */}
                  <div className="space-y-1">
                    {previewLabel && (
                      <p
                        className={`hidden truncate font-mono text-[10px] font-semibold tabular-nums sm:block ${
                          hasExpense && !hasIncome
                            ? "text-rose-600 dark:text-rose-400"
                            : hasIncome && !hasExpense
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {previewLabel}
                      </p>
                    )}

                    {(hasIncome || hasExpense || hasRecurring) && (
                      <div className="flex items-center gap-1">
                        {hasIncome && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        {hasExpense && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        )}
                        {hasRecurring && (
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected Date Summary Panel */}
        <section className="glass-panel flex flex-col justify-between rounded-3xl p-5 sm:p-6 lg:col-span-5">
          <div>
            <div className="flex items-start justify-between gap-3 border-b border-white/60 pb-4 dark:border-white/10">
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {language === "en" ? "Selected Date Summary" : "Ringkasan Tanggal"}
                </p>
                <h3 className="mt-0.5 font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatFullDateLabel(selectedDate, language)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onOpenNewTx("expense", selectedDate)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{language === "en" ? "Log Entry" : "Catat"}</span>
              </button>
            </div>

            {/* Day Totals Strip */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="glass-soft rounded-2xl p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === "en" ? "Income" : "Masuk"}
                </p>
                <p className="mt-1 truncate font-mono text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{formatCurrency(selectedDayData.income, currency, privacyMode)}
                </p>
              </div>
              <div className="glass-soft rounded-2xl p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === "en" ? "Expense" : "Keluar"}
                </p>
                <p className="mt-1 truncate font-mono text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                  -{formatCurrency(selectedDayData.expense, currency, privacyMode)}
                </p>
              </div>
              <div className="glass-soft rounded-2xl p-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === "en" ? "Entries" : "Transaksi"}
                </p>
                <p className="mt-1 font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {selectedDayData.items.length}{" "}
                  {language === "en" ? "items" : "catat"}
                </p>
              </div>
            </div>

            {/* Recurring Scheduled for This Day */}
            {recurringOnSelectedDay.length > 0 && (
              <div className="glass-soft mt-4 rounded-2xl border-violet-200/80 bg-violet-50/45 p-3.5 dark:border-violet-500/30 dark:bg-violet-950/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>
                    {language === "en"
                      ? "Monthly Schedule on This Day"
                      : "Jadwal Rutin di Tanggal Ini"}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {recurringOnSelectedDay.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {rule.merchant}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {rule.type === "income" ? "+" : "-"}
                        {formatCurrency(rule.amount, currency, privacyMode)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day Transactions List */}
            <div className="mt-4">
              {selectedDayData.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
                  <CalendarDays className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {language === "en"
                      ? "No transactions recorded on this date."
                      : "Belum ada transaksi tercatat pada tanggal ini."}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenNewTx("expense", selectedDate)}
                    className="mt-2 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
                  >
                    {language === "en"
                      ? "Add transaction for this day"
                      : "Catat transaksi untuk tanggal ini"}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/60 dark:divide-white/10">
                  {selectedDayData.items.map((tx) => {
                    const catColor = getCategoryColor(tx.category, customCategories);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="glass-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ color: catColor }}
                          >
                            <CategoryIcon category={tx.category} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {tx.merchant}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {getCategoryLabel(tx.category, language, customCategories)}
                              {" · "}
                              {walletMap[tx.walletId] ?? "-"}
                              {tx.notes ? ` · ${tx.notes}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`font-mono text-sm font-semibold tabular-nums ${
                              tx.type === "income"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {tx.type === "income" ? "+" : "-"}
                            {formatCurrency(tx.amount, currency, privacyMode)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            aria-label={`Hapus ${tx.merchant}`}
                            className="rounded-lg p-1 text-slate-400 transition-colors hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
