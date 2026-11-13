import { FormEvent, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Coins,
  CreditCard,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  CreditCardItem,
  Currency,
  DreamGoal,
  InvestmentAsset,
  Language,
  SavingJar,
  Wallet,
} from "../types/finance";
import { formatCurrency } from "../utils/format";

interface AnimatedProgressBarProps {
  pct: number;
  label: string;
  delay?: number;
  trackClassName?: string;
  fillClassName?: string;
}

function AnimatedProgressBar({
  pct,
  label,
  delay = 0,
  trackClassName = "bg-black/10 dark:bg-slate-800",
  fillClassName = "bg-gradient-to-r from-emerald-600 to-emerald-400",
}: AnimatedProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} (${clampedPct}%)`}
      className={`mt-2 h-3 w-full overflow-hidden rounded-full p-0.5 ${trackClassName}`}
    >
      <motion.div
        className={`h-full w-full origin-left rounded-full ${fillClassName}`}
        initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0.7 }}
        animate={{ scaleX: clampedPct / 100, opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.7,
          delay: shouldReduceMotion ? 0 : delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </div>
  );
}

type DreamsSubTab = "dreams" | "jars" | "investments" | "cards";

interface DreamsViewProps {
  dreams: DreamGoal[];
  jars: SavingJar[];
  investments: InvestmentAsset[];
  cards: CreditCardItem[];
  wallets: Wallet[];
  currency: Currency;
  language: Language;
  privacyMode: boolean;
  onAddDream: (goal: Omit<DreamGoal, "id">) => void;
  onContributeDream: (goalId: string, walletId: string, amount: number) => void;
  onDeleteDream: (goalId: string) => void;
  onAddJar: (jar: Omit<SavingJar, "id">) => void;
  onTopUpJar: (jarId: string, walletId: string, amount: number) => void;
  onDeleteJar: (jarId: string) => void;
  onAddInvestment: (asset: Omit<InvestmentAsset, "id">) => void;
  onUpdateInvestmentValue: (id: string, value: number) => void;
  onDeleteInvestment: (id: string) => void;
  onAddCard: (card: Omit<CreditCardItem, "id">) => void;
  onChargeCard: (cardId: string, amount: number) => void;
  onPayCard: (cardId: string, walletId: string, amount: number) => void;
  onDeleteCard: (cardId: string) => void;
}

const STICKY_SURFACES = [
  "border-white/85 bg-[#FEFCE8]/75 backdrop-blur-xl shadow-[0_10px_28px_-12px_rgba(42,31,74,0.1)] dark:border-amber-800/40 dark:bg-[#1E1B10]/75",
  "border-white/85 bg-[#ECFDF5]/75 backdrop-blur-xl shadow-[0_10px_28px_-12px_rgba(42,31,74,0.1)] dark:border-emerald-800/40 dark:bg-[#10201A]/75",
  "border-white/85 bg-[#F0F9FF]/75 backdrop-blur-xl shadow-[0_10px_28px_-12px_rgba(42,31,74,0.1)] dark:border-sky-800/40 dark:bg-[#101C26]/75",
  "border-white/85 bg-[#FFF1F2]/75 backdrop-blur-xl shadow-[0_10px_28px_-12px_rgba(42,31,74,0.1)] dark:border-rose-800/40 dark:bg-[#221317]/75",
];

export function DreamsView({
  dreams,
  jars,
  investments,
  cards,
  wallets,
  currency,
  language,
  privacyMode,
  onAddDream,
  onContributeDream,
  onDeleteDream,
  onAddJar,
  onTopUpJar,
  onDeleteJar,
  onAddInvestment,
  onUpdateInvestmentValue,
  onDeleteInvestment,
  onAddCard,
  onChargeCard,
  onPayCard,
  onDeleteCard,
}: DreamsViewProps) {
  const [subTab, setSubTab] = useState<DreamsSubTab>("dreams");

  // Dream Journey states
  const [showNewDream, setShowNewDream] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("10000000");
  const [currentAmount, setCurrentAmount] = useState("1000000");
  const [monthlyTarget, setMonthlyTarget] = useState("1000000");
  const [deadlineMonth, setDeadlineMonth] = useState("2027-08");
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contribWallet, setContribWallet] = useState(wallets[0]?.id ?? "");
  const [contribAmount, setContribAmount] = useState("500000");

  // Saving Jar states
  const [showNewJar, setShowNewJar] = useState(false);
  const [jarName, setJarName] = useState("");
  const [jarTarget, setJarTarget] = useState("2000000");
  const [jarSaved, setJarSaved] = useState("100000");
  const [topUpJarId, setTopUpJarId] = useState<string | null>(null);
  const [topUpJarWallet, setTopUpJarWallet] = useState(wallets[0]?.id ?? "");
  const [topUpJarAmount, setTopUpJarAmount] = useState("100000");

  // Investment states
  const [showNewInv, setShowNewInv] = useState(false);
  const [invName, setInvName] = useState("");
  const [invType, setInvType] = useState("Reksa Dana");
  const [invCost, setInvCost] = useState("1000000");
  const [invValue, setInvValue] = useState("1050000");
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [editingInvValue, setEditingInvValue] = useState("");

  // Credit card states
  const [showNewCard, setShowNewCard] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardLimit, setCardLimit] = useState("5000000");
  const [cardUsed, setCardUsed] = useState("0");
  const [cardDueDay, setCardDueDay] = useState("25");
  const [cardAction, setCardAction] = useState<{
    id: string;
    mode: "charge" | "pay";
  } | null>(null);
  const [cardActionAmt, setCardActionAmt] = useState("250000");
  const [cardPayWallet, setCardPayWallet] = useState(wallets[0]?.id ?? "");

  const handleCreateDream = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddDream({
      title: title.trim(),
      targetAmount: Math.max(100000, Number(targetAmount) || 5000000),
      currentAmount: Math.max(0, Number(currentAmount) || 0),
      monthlyTarget: Math.max(50000, Number(monthlyTarget) || 500000),
      deadlineMonth,
    });
    setTitle("");
    setShowNewDream(false);
  };

  const handleContribute = (e: FormEvent, goalId: string) => {
    e.preventDefault();
    const amt = Math.max(0, Number(contribAmount.replace(/[^0-9]/g, "")));
    if (amt > 0 && contribWallet) {
      onContributeDream(goalId, contribWallet, amt);
      setContributingId(null);
    }
  };

  const handleCreateJar = (e: FormEvent) => {
    e.preventDefault();
    if (!jarName.trim()) return;
    onAddJar({
      name: jarName.trim(),
      target: Math.max(50000, Number(jarTarget) || 1000000),
      saved: Math.max(0, Number(jarSaved) || 0),
    });
    setJarName("");
    setShowNewJar(false);
  };

  const handleTopUpJar = (e: FormEvent, jarId: string) => {
    e.preventDefault();
    const amt = Math.max(0, Number(topUpJarAmount.replace(/[^0-9]/g, "")));
    if (amt > 0 && topUpJarWallet) {
      onTopUpJar(jarId, topUpJarWallet, amt);
      setTopUpJarId(null);
    }
  };

  const handleCreateInv = (e: FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) return;
    const cost = Math.max(0, Number(invCost) || 0);
    const val = Math.max(0, Number(invValue) || cost);
    onAddInvestment({
      name: invName.trim(),
      assetType: invType,
      cost,
      value: val,
    });
    setInvName("");
    setShowNewInv(false);
  };

  const handleCreateCard = (e: FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    onAddCard({
      name: cardName.trim(),
      limit: Math.max(500000, Number(cardLimit) || 5000000),
      used: Math.max(0, Number(cardUsed) || 0),
      dueDateDay: Math.min(31, Math.max(1, Number(cardDueDay) || 25)),
    });
    setCardName("");
    setShowNewCard(false);
  };

  const totalSaved = dreams.reduce((sum, d) => sum + d.currentAmount, 0);
  const totalTarget = dreams.reduce((sum, d) => sum + d.targetAmount, 0);
  const totalJarSaved = jars.reduce((sum, j) => sum + j.saved, 0);
  const totalInvCost = investments.reduce((sum, a) => sum + a.cost, 0);
  const totalInvValue = investments.reduce((sum, a) => sum + a.value, 0);
  const totalInvProfit = totalInvValue - totalInvCost;
  const totalCardDebt = cards.reduce((sum, c) => sum + c.used, 0);

  const subTabs: Array<{
    id: DreamsSubTab;
    labelId: string;
    labelEn: string;
    icon: typeof Target;
  }> = [
    { id: "dreams", labelId: "Dream Journey", labelEn: "Dream Journey", icon: Target },
    { id: "jars", labelId: "Celengan", labelEn: "Saving Jar", icon: PiggyBank },
    { id: "investments", labelId: "Investasi", labelEn: "Investments", icon: TrendingUp },
    { id: "cards", labelId: "Kartu Kredit", labelEn: "Credit Cards", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="glass-panel flex flex-wrap items-center gap-1.5 rounded-2xl p-1.5">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "bg-[#241F35] text-white shadow-xs dark:bg-emerald-600"
                  : "text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{language === "en" ? tab.labelEn : tab.labelId}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DREAM JOURNEY */}
      {subTab === "dreams" && (
        <div className="space-y-6">
          <section className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Target className="h-4 w-4" />
                <span>Dream Journey Board</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(totalSaved, currency, privacyMode)} /{" "}
                  {formatCurrency(totalTarget, currency, privacyMode)}
                </span>
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                {language === "en"
                  ? "Sticky-Note Financial Milestones"
                  : "Papan Impian Finansial"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Pin your goals like sticky notes, top up anytime, and track estimated completion."
                  : "Tempel target impianmu seperti sticky notes, setor tabungan kapan saja, dan pantau estimasi tercapai."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewDream((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{language === "en" ? "Pin New Dream" : "Tempel Impian Baru"}</span>
            </button>
          </section>

          {showNewDream && (
            <form
              onSubmit={handleCreateDream}
              className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#131918] sm:grid-cols-2 lg:grid-cols-5"
            >
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Goal Name" : "Nama Impian"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: DP Rumah, Umroh, Kamera"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Target Amount" : "Target Dana (Rp)"}
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Initial Saved" : "Sudah Terkumpul"}
                </label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {language === "en" ? "Monthly Plan" : "Nabung/Bulan"}
                  </label>
                  <input
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
                >
                  {language === "en" ? "Create" : "Buat"}
                </button>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === "en" ? "Target Month" : "Target Bulan"}
                </label>
                <input
                  type="month"
                  value={deadlineMonth}
                  onChange={(e) => setDeadlineMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {dreams.map((goal, idx) => {
              const pct = Math.min(
                100,
                Math.round((goal.currentAmount / Math.max(1, goal.targetAmount)) * 100)
              );
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              const monthsNeeded =
                goal.monthlyTarget > 0 ? Math.ceil(remaining / goal.monthlyTarget) : 0;
              const stickyClass = STICKY_SURFACES[idx % STICKY_SURFACES.length];

              return (
                <article
                  key={goal.id}
                  className={`flex flex-col justify-between rounded-xl border p-6 ${stickyClass}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                        {goal.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onDeleteDream(goal.id)}
                        aria-label={`Hapus ${goal.title}`}
                        className="rounded p-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between font-mono tabular-nums">
                      <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(goal.currentAmount, currency, privacyMode)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          pct >= 100
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>

                    <AnimatedProgressBar
                      pct={pct}
                      label={goal.title}
                      delay={Math.min(idx * 0.08, 0.4)}
                      trackClassName="bg-black/10 dark:bg-slate-800/80"
                      fillClassName={
                        pct >= 100
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      }
                    />

                    <div className="mt-4 space-y-1.5 border-t border-black/10 pt-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>{language === "en" ? "Target" : "Target akhir"}</span>
                        <span className="font-mono tabular-nums text-slate-900 dark:text-slate-200">
                          {formatCurrency(goal.targetAmount, currency, privacyMode)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === "en" ? "Monthly pace" : "Rencana nabung"}</span>
                        <span className="font-mono tabular-nums text-slate-900 dark:text-slate-200">
                          {formatCurrency(goal.monthlyTarget, currency, privacyMode)}/bln
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === "en" ? "Estimate" : "Estimasi tercapai"}</span>
                        <span className="font-mono tabular-nums text-slate-900 dark:text-slate-200">
                          {remaining === 0
                            ? language === "en"
                              ? "Achieved!"
                              : "Tercapai!"
                            : `${monthsNeeded} ${language === "en" ? "months" : "bulan lagi"}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    {contributingId === goal.id ? (
                      <form
                        onSubmit={(e) => handleContribute(e, goal.id)}
                        className="space-y-2.5 border-t border-black/10 pt-3 dark:border-white/10"
                      >
                        <select
                          value={contribWallet}
                          onChange={(e) => setContribWallet(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          {wallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({formatCurrency(w.balance, currency, privacyMode)})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={10000}
                            step={50000}
                            value={contribAmount}
                            onChange={(e) => setContribAmount(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
                          >
                            {language === "en" ? "Save" : "Setor"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setContributingId(null)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
                          >
                            {language === "en" ? "Cancel" : "Batal"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        disabled={remaining === 0}
                        onClick={() => {
                          setContributingId(goal.id);
                          setContribWallet(wallets[0]?.id ?? "");
                        }}
                        className="w-full rounded-lg border border-black/15 bg-white/90 py-2 text-xs font-medium text-slate-900 transition-colors hover:border-emerald-600 hover:bg-white disabled:opacity-50 dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-100 whitespace-nowrap cursor-pointer"
                      >
                        {remaining === 0
                          ? language === "en"
                            ? "Goal Reached"
                            : "Target Tercapai"
                          : language === "en"
                            ? "Add Savings"
                            : "Nabungkan Sekarang"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SAVING JAR (CELENGAN) */}
      {subTab === "jars" && (
        <div className="space-y-6">
          <section className="flex flex-col gap-4 glass-panel rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Coins className="h-4 w-4" />
                <span>Saving Jar</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {language === "en" ? "Total collected:" : "Terkumpul:"}{" "}
                  {formatCurrency(totalJarSaved, currency, privacyMode)}
                </span>
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                {language === "en" ? "Micro Saving Jars" : "Celengan Receh & Dana Cepat"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Drop small amounts from your daily wallet into separate jars."
                  : "Sisihkan uang receh atau bonus kecil ke celengan khusus tanpa ribet."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewJar((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{language === "en" ? "New Jar" : "Buat Celengan"}</span>
            </button>
          </section>

          {showNewJar && (
            <form
              onSubmit={handleCreateJar}
              className="grid grid-cols-1 gap-3 glass-panel rounded-3xl p-5 sm:grid-cols-4"
            >
              <input
                type="text"
                value={jarName}
                onChange={(e) => setJarName(e.target.value)}
                placeholder="Nama celengan (mis. Receh 20rb)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 sm:col-span-2"
              />
              <input
                type="number"
                min={50000}
                step={50000}
                value={jarTarget}
                onChange={(e) => setJarTarget(e.target.value)}
                placeholder="Target Rp"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={jarSaved}
                  onChange={(e) => setJarSaved(e.target.value)}
                  placeholder="Awal Rp"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jars.map((jar) => {
              const pct = Math.min(100, Math.round((jar.saved / Math.max(1, jar.target)) * 100));
              const remaining = Math.max(0, jar.target - jar.saved);
              return (
                <article
                  key={jar.id}
                  className="flex flex-col justify-between glass-panel rounded-3xl p-6"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                        {jar.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onDeleteJar(jar.id)}
                        aria-label={`Hapus ${jar.name}`}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between font-mono tabular-nums">
                      <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(jar.saved, currency, privacyMode)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {pct}% / {formatCurrency(jar.target, currency, privacyMode)}
                      </span>
                    </div>
                    <AnimatedProgressBar
                      pct={pct}
                      label={jar.name}
                      trackClassName="bg-slate-100 dark:bg-slate-800"
                      fillClassName="bg-gradient-to-r from-emerald-500 to-teal-400"
                    />
                  </div>

                  <div className="mt-5">
                    {topUpJarId === jar.id ? (
                      <form
                        onSubmit={(e) => handleTopUpJar(e, jar.id)}
                        className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800"
                      >
                        <select
                          value={topUpJarWallet}
                          onChange={(e) => setTopUpJarWallet(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                        >
                          {wallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({formatCurrency(w.balance, currency, privacyMode)})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1000}
                            step={10000}
                            value={topUpJarAmount}
                            onChange={(e) => setTopUpJarAmount(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums dark:border-slate-700 dark:bg-slate-900"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap cursor-pointer"
                          >
                            Isi
                          </button>
                          <button
                            type="button"
                            onClick={() => setTopUpJarId(null)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        disabled={remaining === 0}
                        onClick={() => {
                          setTopUpJarId(jar.id);
                          setTopUpJarWallet(wallets[0]?.id ?? "");
                        }}
                        className="w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/40 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        {remaining === 0
                          ? language === "en"
                            ? "Jar Full!"
                            : "Celengan Penuh!"
                          : language === "en"
                            ? "Add Coins"
                            : "Isi Celengan"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ASET INVESTASI */}
      {subTab === "investments" && (
        <div className="space-y-6">
          <section className="flex flex-col gap-4 glass-panel rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span>{language === "en" ? "Investment Portfolio" : "Portofolio Investasi"}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(totalInvValue, currency, privacyMode)} (
                  {totalInvProfit >= 0 ? "+" : ""}
                  {formatCurrency(totalInvProfit, currency, privacyMode)})
                </span>
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                {language === "en" ? "Gold, Mutual Funds & Stocks" : "Emas, Reksa Dana & Saham"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Monitor invested capital vs current market value."
                  : "Pantau modal awal dibanding nilai sekarang serta persentase cuan."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewInv((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{language === "en" ? "Add Asset" : "Tambah Aset"}</span>
            </button>
          </section>

          {showNewInv && (
            <form
              onSubmit={handleCreateInv}
              className="grid grid-cols-1 gap-3 glass-panel rounded-3xl p-5 sm:grid-cols-5"
            >
              <input
                type="text"
                value={invName}
                onChange={(e) => setInvName(e.target.value)}
                placeholder="Nama aset (mis. Bibit RDPU)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 sm:col-span-2"
              />
              <select
                value={invType}
                onChange={(e) => setInvType(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="Reksa Dana">Reksa Dana</option>
                <option value="Emas">Emas</option>
                <option value="Saham">Saham</option>
                <option value="Crypto">Crypto</option>
                <option value="Deposito">Deposito</option>
              </select>
              <input
                type="number"
                min={0}
                step={50000}
                value={invCost}
                onChange={(e) => setInvCost(e.target.value)}
                placeholder="Modal"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={invValue}
                  onChange={(e) => setInvValue(e.target.value)}
                  placeholder="Nilai kini"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white whitespace-nowrap cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {investments.map((asset) => {
              const diff = asset.value - asset.cost;
              const pct = asset.cost > 0 ? ((diff / asset.cost) * 100).toFixed(1) : "0.0";
              const isPos = diff >= 0;

              return (
                <article
                  key={asset.id}
                  className="flex flex-col justify-between glass-panel rounded-3xl p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {asset.assetType}
                        </p>
                        <h3 className="mt-0.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                          {asset.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteInvestment(asset.id)}
                        aria-label={`Hapus ${asset.name}`}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-4 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCurrency(asset.value, currency, privacyMode)}
                    </p>
                    <p
                      className={`mt-1 font-mono text-xs font-semibold tabular-nums ${
                        isPos
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPos ? "+" : ""}
                      {formatCurrency(diff, currency, privacyMode)} ({isPos ? "+" : ""}
                      {pct}%)
                    </p>
                    <p className="mt-2 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {language === "en" ? "Capital:" : "Modal:"}{" "}
                      {formatCurrency(asset.cost, currency, privacyMode)}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {editingInvId === asset.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingInvValue}
                          onChange={(e) => setEditingInvValue(e.target.value)}
                          className="w-full rounded-lg border border-emerald-500 bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(0, Number(editingInvValue) || 0);
                            onUpdateInvestmentValue(asset.id, val);
                            setEditingInvId(null);
                          }}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInvId(asset.id);
                          setEditingInvValue(String(asset.value));
                        }}
                        className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {language === "en" ? "Update Value" : "Perbarui Nilai"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: KARTU KREDIT & PAYLATER */}
      {subTab === "cards" && (
        <div className="space-y-6">
          <section className="flex flex-col gap-4 glass-panel rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-400">
                <CreditCard className="h-4 w-4" />
                <span>{language === "en" ? "Cards & PayLater" : "Kartu Kredit & PayLater"}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {language === "en" ? "Outstanding:" : "Tagihan berjalan:"}{" "}
                  {formatCurrency(totalCardDebt, currency, privacyMode)}
                </span>
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                {language === "en"
                  ? "Credit Limit & Due Date Guard"
                  : "Kontrol Limit & Jatuh Tempo"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {language === "en"
                  ? "Keep utilization under 30% and pay bills directly from any wallet."
                  : "Jaga pemakaian limit tetap aman dan bayar tagihan langsung dari dompetmu."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewCard((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#241F35] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{language === "en" ? "Add Card" : "Tambah Kartu"}</span>
            </button>
          </section>

          {showNewCard && (
            <form
              onSubmit={handleCreateCard}
              className="grid grid-cols-1 gap-3 glass-panel rounded-3xl p-5 sm:grid-cols-5"
            >
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Nama kartu / PayLater"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 sm:col-span-2"
              />
              <input
                type="number"
                step={500000}
                value={cardLimit}
                onChange={(e) => setCardLimit(e.target.value)}
                placeholder="Limit"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="number"
                step={50000}
                value={cardUsed}
                onChange={(e) => setCardUsed(e.target.value)}
                placeholder="Terpakai"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={cardDueDay}
                  onChange={(e) => setCardDueDay(e.target.value)}
                  placeholder="Tgl JT"
                  className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white whitespace-nowrap cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {cards.map((card) => {
              const pct = Math.min(100, Math.round((card.used / Math.max(1, card.limit)) * 100));
              const available = Math.max(0, card.limit - card.used);
              const isActionOpen = cardAction?.id === card.id;

              return (
                <article
                  key={card.id}
                  className="flex flex-col justify-between glass-panel rounded-3xl p-6"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                          {card.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {language === "en" ? "Due date every" : "Jatuh tempo tiap tgl"}{" "}
                          <span className="font-mono font-semibold">{card.dueDateDay}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteCard(card.id)}
                        aria-label={`Hapus ${card.name}`}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between font-mono tabular-nums">
                      <div>
                        <p className="text-[11px] text-slate-500">
                          {language === "en" ? "Used" : "Tagihan Terpakai"}
                        </p>
                        <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                          {formatCurrency(card.used, currency, privacyMode)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500">
                          {language === "en" ? "Remaining Limit" : "Sisa Limit"}
                        </p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(available, currency, privacyMode)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 75
                            ? "bg-rose-600"
                            : pct >= 35
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    {isActionOpen && cardAction ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const amt = Math.max(0, Number(cardActionAmt) || 0);
                          if (amt <= 0) return;
                          if (cardAction.mode === "charge") {
                            onChargeCard(card.id, amt);
                          } else if (cardPayWallet) {
                            onPayCard(card.id, cardPayWallet, amt);
                          }
                          setCardAction(null);
                        }}
                        className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800"
                      >
                        {cardAction.mode === "pay" && (
                          <select
                            value={cardPayWallet}
                            onChange={(e) => setCardPayWallet(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                          >
                            {wallets.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({formatCurrency(w.balance, currency, privacyMode)})
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1000}
                            step={50000}
                            value={cardActionAmt}
                            onChange={(e) => setCardActionAmt(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums dark:border-slate-700 dark:bg-slate-900"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap cursor-pointer"
                          >
                            {cardAction.mode === "charge" ? "Catat" : "Bayar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardAction(null)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCardAction({ id: card.id, mode: "charge" });
                            setCardActionAmt("150000");
                          }}
                          className="rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {language === "en" ? "Use Limit" : "Pakai Limit"}
                        </button>
                        <button
                          type="button"
                          disabled={card.used <= 0}
                          onClick={() => {
                            setCardAction({ id: card.id, mode: "pay" });
                            setCardActionAmt(String(card.used));
                            setCardPayWallet(wallets[0]?.id ?? "");
                          }}
                          className="rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                        >
                          {language === "en" ? "Pay Bill" : "Bayar Tagihan"}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
