import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Check, Flame, HandCoins, Plus, Trash2 } from "lucide-react";
import {
  Budget,
  CategoryId,
  Currency,
  CustomCategory,
  DebtItem,
  Language,
  SpendingChallenge,
  Transaction,
} from "../types/finance";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryLabel,
} from "../utils/format";
import { CategoryIcon } from "./CategoryIcon";

interface BudgetsChallengesViewProps {
  budgets: Budget[];
  transactions: Transaction[];
  challenges: SpendingChallenge[];
  debts: DebtItem[];
  customCategories?: CustomCategory[];
  selectedMonth: string;
  currency: Currency;
  language: Language;
  privacyMode: boolean;
  onUpdateBudget: (category: CategoryId, monthlyLimit: number) => void;
  onCheckInChallenge: (id: string) => void;
  onAddChallenge: (challenge: Omit<SpendingChallenge, "id">) => void;
  onDeleteChallenge: (id: string) => void;
  onAddDebt: (debt: Omit<DebtItem, "id">) => void;
  onToggleDebtPaid: (id: string) => void;
  onDeleteDebt: (id: string) => void;
}

export function BudgetsChallengesView({
  budgets,
  transactions,
  challenges,
  debts,
  customCategories = [],
  selectedMonth,
  currency,
  language,
  privacyMode,
  onUpdateBudget,
  onCheckInChallenge,
  onAddChallenge,
  onDeleteChallenge,
  onAddDebt,
  onToggleDebtPaid,
  onDeleteDebt,
}: BudgetsChallengesViewProps) {
  const [editingCat, setEditingCat] = useState<CategoryId | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newBudgetCat, setNewBudgetCat] = useState<CategoryId>("pendidikan");
  const [newBudgetAmt, setNewBudgetAmt] = useState("300000");

  // Challenge form
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [chTitle, setChTitle] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chDays, setChDays] = useState("7");
  const [chSaving, setChSaving] = useState("200000");

  // Debt / Receivable form
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debtPerson, setDebtPerson] = useState("");
  const [debtAmount, setDebtAmount] = useState("50000");
  const [debtKind, setDebtKind] = useState<"hutang" | "piutang">("piutang");
  const [debtNote, setDebtNote] = useState("");

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(selectedMonth) && t.type === "expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    return map;
  }, [transactions, selectedMonth]);

  const allExpenseCategories: CategoryId[] = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.filter((c) => c.type === "expense").map((c) => c.id as CategoryId),
  ];

  const unbudgetedCategories = allExpenseCategories.filter(
    (cat) => !budgets.some((b) => b.category === cat)
  );

  const handleSaveEdit = (cat: CategoryId) => {
    const num = Math.max(0, Number(editValue.replace(/[^0-9]/g, "")));
    if (num > 0) {
      onUpdateBudget(cat, num);
    }
    setEditingCat(null);
  };

  const handleAddBudget = (e: FormEvent) => {
    e.preventDefault();
    const num = Math.max(0, Number(newBudgetAmt.replace(/[^0-9]/g, "")));
    if (num > 0) {
      onUpdateBudget(newBudgetCat, num);
      setNewBudgetAmt("300000");
    }
  };

  const handleCreateChallenge = (e: FormEvent) => {
    e.preventDefault();
    if (!chTitle.trim()) return;
    onAddChallenge({
      title: chTitle.trim(),
      description:
        chDesc.trim() || "Jaga komitmen harian agar keuangan tetap anti bocor.",
      targetDays: Math.max(1, Number(chDays) || 7),
      completedDays: 0,
      estimatedSaving: Math.max(0, Number(chSaving) || 150000),
      active: true,
    });
    setChTitle("");
    setChDesc("");
    setShowChallengeForm(false);
  };

  const totalChallengeSavings = challenges.reduce(
    (sum, ch) =>
      sum + Math.round((ch.completedDays / Math.max(1, ch.targetDays)) * ch.estimatedSaving),
    0
  );

  const criticalBudgetCount = budgets.filter((b) => {
    if (b.monthlyLimit <= 0) return false;
    const spent = spentByCategory[b.category] ?? 0;
    return (spent / b.monthlyLimit) * 100 > 90;
  }).length;

  return (
    <div className="space-y-6">
      {/* Monthly Category Budgets */}
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col gap-3 border-b border-white/60 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {language === "en"
                ? "Monthly Category Budgets"
                : "Batas Anggaran Bulanan"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "en"
                ? "Set realistic monthly limits per category to prevent silent leaks."
                : "Atur batas pengeluaran tiap kategori supaya dompet aman sampai gajian."}
              {criticalBudgetCount > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {language === "en"
                        ? `${criticalBudgetCount} ${criticalBudgetCount === 1 ? "category" : "categories"} over 90% limit`
                        : `${criticalBudgetCount} kategori melebihi 90% batas`}
                    </span>
                  </span>
                </>
              )}
            </p>
          </div>

          {unbudgetedCategories.length > 0 && (
            <form onSubmit={handleAddBudget} className="flex items-center gap-2">
              <select
                value={
                  unbudgetedCategories.includes(newBudgetCat)
                    ? newBudgetCat
                    : unbudgetedCategories[0]
                }
                onChange={(e) => setNewBudgetCat(e.target.value as CategoryId)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {unbudgetedCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat, language, customCategories)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={10000}
                step={50000}
                value={newBudgetAmt}
                onChange={(e) => setNewBudgetAmt(e.target.value)}
                className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{language === "en" ? "Add" : "Tambah"}</span>
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {budgets.map((b) => {
            const spent = spentByCategory[b.category] ?? 0;
            const exactPct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
            const pct = Math.round(exactPct);
            const isOver = exactPct > 100;
            const isCritical = exactPct > 90;
            const isWarn = exactPct >= 80 && !isCritical;
            const isEditing = editingCat === b.category;
            const remaining = b.monthlyLimit - spent;

            return (
              <div
                key={b.category}
                className={`rounded-2xl p-4 transition-colors ${
                  isCritical
                    ? "glass-soft border-rose-300/90 bg-rose-50/55 dark:border-rose-500/40 dark:bg-rose-950/25"
                    : "glass-soft"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isCritical
                          ? "bg-rose-100/90 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <CategoryIcon category={b.category} className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {getCategoryLabel(b.category, language, customCategories)}
                      </p>
                      <p
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          isCritical
                            ? "text-rose-600 dark:text-rose-400"
                            : isWarn
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isCritical && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>
                          {isOver
                            ? language === "en"
                              ? "Exceeded limit"
                              : "Melebihi batas"
                            : isCritical
                              ? language === "en"
                                ? "Critical (>90%)"
                                : "Kritis (>90%)"
                              : isWarn
                                ? language === "en"
                                  ? "Approaching limit"
                                  : "Waspada"
                                : language === "en"
                                  ? "On track"
                                  : "Aman"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{pct}%</span>
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-28 rounded-md border border-emerald-500 bg-white px-2 py-1 font-mono text-xs tabular-nums text-slate-900 outline-none dark:bg-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(b.category)}
                        className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(b.category);
                        setEditValue(String(b.monthlyLimit));
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 whitespace-nowrap cursor-pointer"
                    >
                      {language === "en" ? "Edit limit" : "Ubah batas"}
                    </button>
                  )}
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={Math.min(100, pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${getCategoryLabel(b.category, language, customCategories)} ${pct}%`}
                  className={`mt-4 h-2.5 w-full overflow-hidden rounded-full ${
                    isCritical
                      ? "bg-rose-100 dark:bg-rose-950/60"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCritical
                        ? "bg-rose-600 dark:bg-rose-500"
                        : isWarn
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  <span>
                    {language === "en" ? "Spent:" : "Terpakai:"}{" "}
                    <strong
                      className={`font-medium ${
                        isCritical
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {formatCurrency(spent, currency, privacyMode)}
                    </strong>
                  </span>
                  <span>
                    {isCritical ? (
                      remaining < 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          {language === "en" ? "Over" : "Lebih"}{" "}
                          {formatCurrency(Math.abs(remaining), currency, privacyMode)}
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">
                          {language === "en" ? "Left" : "Sisa"}{" "}
                          {formatCurrency(remaining, currency, privacyMode)}
                        </span>
                      )
                    ) : (
                      <>
                        {language === "en" ? "Limit:" : "Batas:"}{" "}
                        {formatCurrency(b.monthlyLimit, currency, privacyMode)}
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Spending Challenges */}
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col gap-3 border-b border-white/60 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
              <Flame className="h-4 w-4" />
              <span>
                {language === "en" ? "Gamified Saving Habit" : "Tantangan Hemat"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {language === "en" ? "Estimated saved" : "Estimasi terhemat"}{" "}
                {formatCurrency(totalChallengeSavings, currency, privacyMode)}
              </span>
            </div>
            <h3 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {language === "en"
                ? "Daily Anti-Leak Challenges"
                : "Misi Harian Anti-Bocor"}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowChallengeForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{language === "en" ? "New Challenge" : "Buat Tantangan"}</span>
          </button>
        </div>

        {showChallengeForm && (
          <form
            onSubmit={handleCreateChallenge}
            className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/50 sm:grid-cols-4"
          >
            <input
              type="text"
              value={chTitle}
              onChange={(e) => setChTitle(e.target.value)}
              placeholder={
                language === "en"
                  ? "Challenge name"
                  : "Nama misi (mis. Tanpa GoFood)"
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:col-span-2"
            />
            <input
              type="number"
              min={1}
              value={chDays}
              onChange={(e) => setChDays(e.target.value)}
              placeholder="Target hari"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <input
                type="number"
                step={25000}
                value={chSaving}
                onChange={(e) => setChSaving(e.target.value)}
                placeholder="Target hemat"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
              >
                {language === "en" ? "Save" : "Simpan"}
              </button>
            </div>
            <input
              type="text"
              value={chDesc}
              onChange={(e) => setChDesc(e.target.value)}
              placeholder={
                language === "en"
                  ? "Short rule description..."
                  : "Aturan singkat tantangan..."
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:col-span-4"
            />
          </form>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {challenges.map((ch) => {
            const pct = Math.min(
              100,
              Math.round((ch.completedDays / Math.max(1, ch.targetDays)) * 100)
            );
            const isCompleted = ch.completedDays >= ch.targetDays;

            return (
              <div
                key={ch.id}
                className="glass-soft flex flex-col justify-between rounded-2xl p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                      {ch.title}
                    </h4>
                    <button
                      type="button"
                      onClick={() => onDeleteChallenge(ch.id)}
                      aria-label={`Hapus ${ch.title}`}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {ch.description}
                  </p>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between font-mono text-xs tabular-nums">
                    <span className="text-slate-700 dark:text-slate-300">
                      {ch.completedDays}/{ch.targetDays}{" "}
                      {language === "en" ? "days" : "hari"}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(ch.estimatedSaving, currency, privacyMode)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isCompleted}
                    onClick={() => onCheckInChallenge(ch.id)}
                    className={`mt-4 w-full rounded-lg py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    }`}
                  >
                    {isCompleted
                      ? language === "en"
                        ? "Completed!"
                        : "Misi Selesai!"
                      : language === "en"
                        ? "Check-in Today"
                        : "Berhasil Hari Ini"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hutang & Piutang Tracker */}
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col gap-3 border-b border-white/60 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-purple-700 dark:text-purple-400">
              <HandCoins className="h-4 w-4" />
              <span>
                {language === "en" ? "Split Bills & Loans" : "Catatan Hutang & Piutang"}
              </span>
            </div>
            <h3 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              {language === "en"
                ? "Who Owes Whom"
                : "Talangan & Pinjaman Teman"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowDebtForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{language === "en" ? "Add Record" : "Catat Baru"}</span>
          </button>
        </div>

        {showDebtForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Math.max(0, Number(debtAmount) || 0);
              if (!debtPerson.trim() || amt <= 0) return;
              onAddDebt({
                person: debtPerson.trim(),
                amount: amt,
                kind: debtKind,
                paid: false,
                note: debtNote.trim() || undefined,
              });
              setDebtPerson("");
              setDebtNote("");
              setShowDebtForm(false);
            }}
            className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/50 sm:grid-cols-5"
          >
            <input
              type="text"
              value={debtPerson}
              onChange={(e) => setDebtPerson(e.target.value)}
              placeholder="Nama orang / keperluan"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:col-span-2"
            />
            <select
              value={debtKind}
              onChange={(e) => setDebtKind(e.target.value as "hutang" | "piutang")}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="piutang">Piutang (Teman pinjam)</option>
              <option value="hutang">Hutang (Kita pinjam)</option>
            </select>
            <input
              type="number"
              min={1000}
              step={5000}
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
            >
              {language === "en" ? "Save" : "Simpan"}
            </button>
          </form>
        )}

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {debts.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              {language === "en"
                ? "No pending debts or split bills."
                : "Belum ada catatan hutang atau piutang."}
            </p>
          ) : (
            debts.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      d.paid
                        ? "line-through text-slate-400"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {d.person}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {d.kind === "piutang"
                      ? language === "en"
                        ? "Receivable"
                        : "Piutang (masuk)"
                      : language === "en"
                        ? "Debt"
                        : "Hutang (keluar)"}
                    {d.note ? ` · ${d.note}` : ""}
                    {d.paid ? " · Lunas" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      d.paid
                        ? "text-slate-400"
                        : d.kind === "piutang"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {formatCurrency(d.amount, currency, privacyMode)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleDebtPaid(d.id)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                      d.paid
                        ? "border-slate-200 text-slate-500 dark:border-slate-700"
                        : "border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                    }`}
                  >
                    {d.paid ? "Buka Lagi" : "Tandai Lunas"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDebt(d.id)}
                    aria-label={`Hapus ${d.person}`}
                    className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
