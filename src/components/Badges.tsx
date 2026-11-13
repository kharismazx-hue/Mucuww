import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Award,
  CalendarCheck2,
  CheckCircle2,
  Crown,
  Lock,
  PiggyBank,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  Currency,
  DreamGoal,
  Language,
  SavingJar,
  TabId,
  Transaction,
  Wallet,
} from "../types/finance";
import { formatCurrency } from "../utils/format";

type BadgeCategory = "all" | "frequency" | "savings";

interface BadgesProps {
  transactions: Transaction[];
  wallets: Wallet[];
  dreams: DreamGoal[];
  jars?: SavingJar[];
  selectedMonth: string;
  currency: Currency;
  language: Language;
  privacyMode: boolean;
  onNavigate?: (tab: TabId) => void;
}

interface BadgeDefinition {
  id: string;
  category: "frequency" | "savings";
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  current: number;
  target: number;
  progressLabelId: string;
  progressLabelEn: string;
  unlocked: boolean;
  accentBg: string;
  accentText: string;
  icon: typeof Award;
  actionTab: TabId;
  actionLabelId: string;
  actionLabelEn: string;
}

export function Badges({
  transactions,
  wallets,
  dreams,
  jars = [],
  selectedMonth,
  currency,
  language,
  privacyMode,
  onNavigate,
}: BadgesProps) {
  const [filter, setFilter] = useState<BadgeCategory>("all");
  const shouldReduceMotion = useReducedMotion();

  const metrics = useMemo(() => {
    const monthlyTxs = transactions.filter((t) => t.date.startsWith(selectedMonth));
    const monthlyTxCount = monthlyTxs.length;
    const totalTxCount = transactions.length;
    const activeDaysCount = new Set(monthlyTxs.map((t) => t.date)).size;

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    monthlyTxs.forEach((t) => {
      if (t.type === "income") monthlyIncome += t.amount;
      else monthlyExpense += t.amount;
    });

    const monthlySavingsRate =
      monthlyIncome > 0
        ? Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100))
        : 0;

    const savingsWalletTotal = wallets
      .filter((w) => w.type === "savings")
      .reduce((sum, w) => sum + w.balance, 0);
    const dreamsTotal = dreams.reduce((sum, d) => sum + d.currentAmount, 0);
    const jarsTotal = jars.reduce((sum, j) => sum + j.saved, 0);
    const totalSavingsMilestone = savingsWalletTotal + dreamsTotal + jarsTotal;

    return {
      monthlyTxCount,
      totalTxCount,
      activeDaysCount,
      monthlySavingsRate,
      totalSavingsMilestone,
    };
  }, [transactions, wallets, dreams, jars, selectedMonth]);

  const badges: BadgeDefinition[] = useMemo(() => {
    const {
      monthlyTxCount,
      totalTxCount,
      activeDaysCount,
      monthlySavingsRate,
      totalSavingsMilestone,
    } = metrics;

    const target10M = 10_000_000;
    const target50M = 50_000_000;

    return [
      {
        id: "freq-monthly-10",
        category: "frequency",
        titleId: "Rajin Catat",
        titleEn: "Steady Logger",
        descId: "Catat minimal 10 transaksi pada bulan aktif.",
        descEn: "Log at least 10 transactions in the active month.",
        current: monthlyTxCount,
        target: 10,
        progressLabelId: `${Math.min(monthlyTxCount, 10)} / 10 transaksi`,
        progressLabelEn: `${Math.min(monthlyTxCount, 10)} / 10 entries`,
        unlocked: monthlyTxCount >= 10,
        accentBg: "bg-sky-100/85 dark:bg-sky-950/60",
        accentText: "text-sky-700 dark:text-sky-300",
        icon: Zap,
        actionTab: "transactions",
        actionLabelId: "Catat lagi",
        actionLabelEn: "Log more",
      },
      {
        id: "freq-days-15",
        category: "frequency",
        titleId: "Ritme 15 Hari",
        titleEn: "15-Day Rhythm",
        descId: "Catat transaksi di 15 hari berbeda dalam sebulan.",
        descEn: "Record entries across 15 distinct days in a month.",
        current: activeDaysCount,
        target: 15,
        progressLabelId: `${Math.min(activeDaysCount, 15)} / 15 hari aktif`,
        progressLabelEn: `${Math.min(activeDaysCount, 15)} / 15 active days`,
        unlocked: activeDaysCount >= 15,
        accentBg: "bg-violet-100/85 dark:bg-violet-950/60",
        accentText: "text-violet-700 dark:text-violet-300",
        icon: CalendarCheck2,
        actionTab: "transactions",
        actionLabelId: "Tambah hari",
        actionLabelEn: "Add day",
      },
      {
        id: "freq-total-30",
        category: "frequency",
        titleId: "Kolektor Arsip",
        titleEn: "Ledger Collector",
        descId: "Kumpulkan 30 total catatan keuangan di dompetmu.",
        descEn: "Reach 30 total logged transactions across months.",
        current: totalTxCount,
        target: 30,
        progressLabelId: `${Math.min(totalTxCount, 30)} / 30 catatan`,
        progressLabelEn: `${Math.min(totalTxCount, 30)} / 30 logs`,
        unlocked: totalTxCount >= 30,
        accentBg: "bg-amber-100/85 dark:bg-amber-950/60",
        accentText: "text-amber-700 dark:text-amber-300",
        icon: Award,
        actionTab: "transactions",
        actionLabelId: "Lihat ledger",
        actionLabelEn: "View ledger",
      },
      {
        id: "sav-rate-25",
        category: "savings",
        titleId: "Penjaga Surplus",
        titleEn: "Surplus Keeper",
        descId: "Pertahankan rasio tabungan bulanan minimal 25%.",
        descEn: "Maintain a monthly savings rate of at least 25%.",
        current: monthlySavingsRate,
        target: 25,
        progressLabelId: `${Math.min(monthlySavingsRate, 25)}% / 25% rasio`,
        progressLabelEn: `${Math.min(monthlySavingsRate, 25)}% / 25% rate`,
        unlocked: monthlySavingsRate >= 25,
        accentBg: "bg-emerald-100/85 dark:bg-emerald-950/60",
        accentText: "text-emerald-700 dark:text-emerald-300",
        icon: PiggyBank,
        actionTab: "budgets",
        actionLabelId: "Cek budget",
        actionLabelEn: "Check budget",
      },
      {
        id: "sav-10m",
        category: "savings",
        titleId: "Benteng Simpanan",
        titleEn: "Safety Nest",
        descId: `Capai total simpanan & impian ${formatCurrency(target10M, currency, privacyMode)}.`,
        descEn: `Reach ${formatCurrency(target10M, currency, privacyMode)} in combined savings & dreams.`,
        current: totalSavingsMilestone,
        target: target10M,
        progressLabelId: `${formatCurrency(Math.min(totalSavingsMilestone, target10M), currency, privacyMode)} / ${formatCurrency(target10M, currency, privacyMode)}`,
        progressLabelEn: `${formatCurrency(Math.min(totalSavingsMilestone, target10M), currency, privacyMode)} / ${formatCurrency(target10M, currency, privacyMode)}`,
        unlocked: totalSavingsMilestone >= target10M,
        accentBg: "bg-teal-100/85 dark:bg-teal-950/60",
        accentText: "text-teal-700 dark:text-teal-300",
        icon: ShieldCheck,
        actionTab: "dreams",
        actionLabelId: "Isi impian",
        actionLabelEn: "Top up dreams",
      },
      {
        id: "sav-50m",
        category: "savings",
        titleId: "Klub Mochi Sultan",
        titleEn: "50M Wealth Club",
        descId: `Kumpulkan total simpanan & impian hingga ${formatCurrency(target50M, currency, privacyMode)}.`,
        descEn: `Grow combined savings & dreams to ${formatCurrency(target50M, currency, privacyMode)}.`,
        current: totalSavingsMilestone,
        target: target50M,
        progressLabelId: `${formatCurrency(Math.min(totalSavingsMilestone, target50M), currency, privacyMode)} / ${formatCurrency(target50M, currency, privacyMode)}`,
        progressLabelEn: `${formatCurrency(Math.min(totalSavingsMilestone, target50M), currency, privacyMode)} / ${formatCurrency(target50M, currency, privacyMode)}`,
        unlocked: totalSavingsMilestone >= target50M,
        accentBg: "bg-rose-100/85 dark:bg-rose-950/60",
        accentText: "text-rose-700 dark:text-rose-300",
        icon: Crown,
        actionTab: "dreams",
        actionLabelId: "Kejar target",
        actionLabelEn: "Boost goal",
      },
    ];
  }, [metrics, currency, privacyMode]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const visibleBadges =
    filter === "all" ? badges : badges.filter((b) => b.category === filter);

  return (
    <section
      aria-label={language === "en" ? "Achievement Badges" : "Lencana Pencapaian"}
      className="glass-panel rounded-3xl p-6"
    >
      <div className="flex flex-col gap-3 border-b border-white/60 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {language === "en" ? "Achievement Badges" : "Lencana Pencapaian"}
            </h3>
            <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              {unlockedCount} / {badges.length}{" "}
              {language === "en" ? "unlocked" : "terbuka"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {language === "en"
              ? "Unlocked automatically from your logging streak and savings milestones."
              : "Terbuka otomatis dari frekuensi catat transaksi dan milestone tabunganmu."}
          </p>
        </div>

        <div className="glass-soft flex items-center gap-1 self-start rounded-xl p-1">
          {(
            [
              { id: "all", labelId: "Semua", labelEn: "All" },
              { id: "frequency", labelId: "Frekuensi", labelEn: "Frequency" },
              { id: "savings", labelId: "Tabungan", labelEn: "Savings" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? "bg-[#241F35] text-white shadow-xs dark:bg-emerald-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              {language === "en" ? tab.labelEn : tab.labelId}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleBadges.map((badge, idx) => {
          const Icon = badge.icon;
          const pct = Math.min(
            100,
            Math.round((badge.current / Math.max(1, badge.target)) * 100)
          );

          return (
            <motion.article
              key={badge.id}
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col justify-between rounded-2xl p-4 transition-colors ${
                badge.unlocked
                  ? "glass-soft border-emerald-200/90 bg-white/80 dark:border-emerald-500/30 dark:bg-emerald-950/20"
                  : "glass-soft opacity-90"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        badge.unlocked
                          ? `${badge.accentBg} ${badge.accentText}`
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {language === "en" ? badge.titleEn : badge.titleId}
                      </h4>
                      <p
                        className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium ${
                          badge.unlocked
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {badge.unlocked ? (
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                        ) : (
                          <Lock className="h-3 w-3 shrink-0" />
                        )}
                        <span>
                          {badge.unlocked
                            ? language === "en"
                              ? "Unlocked"
                              : "Terbuka"
                            : language === "en"
                              ? "Locked"
                              : "Terkunci"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{pct}%</span>
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {language === "en" ? badge.descEn : badge.descId}
                </p>
              </div>

              <div className="mt-4">
                <div
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${language === "en" ? badge.titleEn : badge.titleId} (${pct}%)`}
                  className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800"
                >
                  <motion.div
                    className={`h-full w-full origin-left rounded-full ${
                      badge.unlocked
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : "bg-gradient-to-r from-violet-400 to-sky-400 dark:from-violet-500 dark:to-sky-500"
                    }`}
                    initial={shouldReduceMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.65,
                      delay: shouldReduceMotion ? 0 : Math.min(idx * 0.06, 0.3),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {language === "en" ? badge.progressLabelEn : badge.progressLabelId}
                  </span>
                  {!badge.unlocked && onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate(badge.actionTab)}
                      className="shrink-0 font-semibold text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap cursor-pointer"
                    >
                      {language === "en" ? badge.actionLabelEn : badge.actionLabelId}
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
