import { useEffect, useState } from "react";
import {
  CalendarDays,
  Camera,
  Eye,
  EyeOff,
  LayoutDashboard,
  ListOrdered,
  Moon,
  PiggyBank,
  Plus,
  RotateCcw,
  Settings,
  Sun,
  Target,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  AppThemeMode,
  AutoTransferRule,
  Budget,
  CategoryId,
  CreditCardItem,
  Currency,
  CustomCategory,
  DebtItem,
  DreamGoal,
  InvestmentAsset,
  Language,
  RecurringTransactionRule,
  SavingJar,
  SpendingChallenge,
  TabId,
  Transaction,
  TransactionType,
  Wallet,
  WidgetShape,
  WidgetTheme,
} from "./types/finance";
import {
  INITIAL_AUTOTRANSFERS,
  INITIAL_BUDGETS,
  INITIAL_CARDS,
  INITIAL_CHALLENGES,
  INITIAL_CUSTOM_CATEGORIES,
  INITIAL_DEBTS,
  INITIAL_DREAMS,
  INITIAL_INVESTMENTS,
  INITIAL_JARS,
  INITIAL_RECURRING_RULES,
  INITIAL_TRANSACTIONS,
  INITIAL_WALLETS,
} from "./data/seedData";
import { formatMonthLabel } from "./utils/format";
import { playPopChime } from "./utils/sound";
import { OverviewView } from "./components/OverviewView";
import { TransactionsView } from "./components/TransactionsView";
import { CalendarView } from "./components/CalendarView";
import { ScannerView } from "./components/ScannerView";
import { BudgetsChallengesView } from "./components/BudgetsChallengesView";
import { DreamsView } from "./components/DreamsView";
import { WalletsReportsView } from "./components/WalletsReportsView";
import { TransactionModal } from "./components/TransactionModal";
import { ProfileSettingsModal } from "./components/ProfileSettingsModal";
import { OfflineIndicator, PWAInstallButton } from "./components/PWAInstallPrompt";
import { MobileBottomNav } from "./components/MobileBottomNav";

const STORAGE_KEY = "mucuw_finance_state_v4";

interface PersistedState {
  userName: string;
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  challenges: SpendingChallenge[];
  dreams: DreamGoal[];
  jars: SavingJar[];
  investments: InvestmentAsset[];
  cards: CreditCardItem[];
  debts: DebtItem[];
  autoTransfers: AutoTransferRule[];
  recurringRules: RecurringTransactionRule[];
  customCategories: CustomCategory[];
  language: Language;
  currency: Currency;
  appTheme: AppThemeMode;
  soundEnabled: boolean;
  privacyMode: boolean;
  widgetTheme: WidgetTheme;
  widgetShape: WidgetShape;
  companionName: string;
  companionAvatarUrl?: string;
}

function getDefaultState(): PersistedState {
  return {
    userName: "Teman",
    wallets: INITIAL_WALLETS,
    transactions: INITIAL_TRANSACTIONS,
    budgets: INITIAL_BUDGETS,
    challenges: INITIAL_CHALLENGES,
    dreams: INITIAL_DREAMS,
    jars: INITIAL_JARS,
    investments: INITIAL_INVESTMENTS,
    cards: INITIAL_CARDS,
    debts: INITIAL_DEBTS,
    autoTransfers: INITIAL_AUTOTRANSFERS,
    recurringRules: INITIAL_RECURRING_RULES,
    customCategories: INITIAL_CUSTOM_CATEGORIES,
    language: "id",
    currency: "IDR",
    appTheme: "pastel",
    soundEnabled: true,
    privacyMode: false,
    widgetTheme: "sky",
    widgetShape: "square",
    companionName: "Mucuw",
    companionAvatarUrl: "",
  };
}

function reconcileDueRecurring(
  rules: RecurringTransactionRule[],
  wallets: Wallet[],
  transactions: Transaction[],
  language: Language,
  now: Date = new Date()
): {
  rules: RecurringTransactionRule[];
  wallets: Wallet[];
  transactions: Transaction[];
  postedMerchants: string[];
} {
  const year = now.getFullYear();
  const monthIdx = now.getMonth() + 1;
  const currentDay = now.getDate();
  const currentMonthKey = `${year}-${String(monthIdx).padStart(2, "0")}`;
  const daysInMonth = new Date(year, monthIdx, 0).getDate();

  const newTxs: Transaction[] = [];
  const walletDeltas: Record<string, number> = {};
  const postedMerchants: string[] = [];

  const nextRules = rules.map((rule) => {
    if (!rule.active) return rule;
    const effectiveDay = Math.min(Math.max(1, rule.dayOfMonth), daysInMonth);
    const alreadyHandled =
      Boolean(rule.lastGeneratedMonth) &&
      rule.lastGeneratedMonth! >= currentMonthKey;

    if (alreadyHandled || currentDay < effectiveDay) {
      return rule;
    }

    const txId = `rec-tx-${rule.id}-${currentMonthKey}`;
    if (!transactions.some((t) => t.id === txId)) {
      const txDate = `${currentMonthKey}-${String(effectiveDay).padStart(2, "0")}`;
      newTxs.push({
        id: txId,
        merchant: rule.merchant,
        amount: rule.amount,
        type: rule.type,
        category: rule.category,
        walletId: rule.walletId,
        date: txDate,
        notes:
          rule.notes ||
          (language === "en"
            ? "Auto-scheduled monthly"
            : "Jadwal rutin bulanan"),
        source: "recurring",
      });
      const delta = rule.type === "income" ? rule.amount : -rule.amount;
      walletDeltas[rule.walletId] = (walletDeltas[rule.walletId] ?? 0) + delta;
      postedMerchants.push(rule.merchant);
    }

    return {
      ...rule,
      lastGeneratedMonth: currentMonthKey,
    };
  });

  if (newTxs.length === 0) {
    return { rules: nextRules, wallets, transactions, postedMerchants };
  }

  const nextWallets = wallets.map((w) =>
    walletDeltas[w.id] ? { ...w, balance: w.balance + walletDeltas[w.id] } : w
  );

  return {
    rules: nextRules,
    wallets: nextWallets,
    transactions: [...newTxs, ...transactions],
    postedMerchants,
  };
}

function loadInitialState(): PersistedState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("mucuw_finance_state_v3") ||
      localStorage.getItem("mucuw_finance_state_v2") ||
      localStorage.getItem("mucuw_finance_state_v1");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState> & {
        theme?: "light" | "dark";
      };
      if (parsed.wallets && parsed.transactions) {
        const legacyTheme: AppThemeMode =
          parsed.appTheme ?? (parsed.theme === "dark" ? "dark" : "pastel");
        return {
          ...getDefaultState(),
          ...parsed,
          appTheme: legacyTheme,
          jars: parsed.jars ?? INITIAL_JARS,
          investments: parsed.investments ?? INITIAL_INVESTMENTS,
          cards: parsed.cards ?? INITIAL_CARDS,
          recurringRules: parsed.recurringRules ?? INITIAL_RECURRING_RULES,
          customCategories: parsed.customCategories ?? INITIAL_CUSTOM_CATEGORIES,
          userName: parsed.userName ?? "Teman",
          soundEnabled: parsed.soundEnabled ?? true,
        };
      }
    }
  } catch {
    // Fallback to initial seed state
  }
  return getDefaultState();
}

export default function App() {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedMonth, setSelectedMonth] = useState("2026-11");
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>("all");
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>("expense");
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [autoPostedNotice, setAutoPostedNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const actionParam = params.get("action");
    if (
      tabParam === "overview" ||
      tabParam === "transactions" ||
      tabParam === "calendar" ||
      tabParam === "scanner" ||
      tabParam === "budgets" ||
      tabParam === "dreams" ||
      tabParam === "wallets"
    ) {
      setActiveTab(tabParam);
    }
    if (actionParam === "expense" || actionParam === "income") {
      setModalDefaultType(actionParam);
      setIsTxModalOpen(true);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    const runReconcile = () => {
      setState((prev) => {
        const result = reconcileDueRecurring(
          prev.recurringRules,
          prev.wallets,
          prev.transactions,
          prev.language
        );
        if (result.postedMerchants.length === 0) return prev;
        setAutoPostedNotice(
          prev.language === "en"
            ? `${result.postedMerchants.length} recurring monthly item(s) automatically added to the ledger (${result.postedMerchants.join(", ")}).`
            : `${result.postedMerchants.length} transaksi rutin otomatis masuk ke ledger (${result.postedMerchants.join(", ")}).`
        );
        return {
          ...prev,
          recurringRules: result.rules,
          wallets: result.wallets,
          transactions: result.transactions,
        };
      });
    };

    runReconcile();
    const timer = setInterval(runReconcile, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (state.appTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.setAttribute("data-app-theme", state.appTheme);
  }, [state.appTheme]);

  const {
    userName,
    wallets,
    transactions,
    budgets,
    challenges,
    dreams,
    jars,
    investments,
    cards,
    debts,
    autoTransfers,
    recurringRules,
    customCategories,
    language,
    currency,
    appTheme,
    soundEnabled,
    privacyMode,
    widgetTheme,
    widgetShape,
    companionName,
    companionAvatarUrl,
  } = state;

  const navItems: Array<{
    id: TabId;
    labelId: string;
    labelEn: string;
    mobileLabelId: string;
    mobileLabelEn: string;
    icon: typeof LayoutDashboard;
  }> = [
    {
      id: "overview",
      labelId: "Ringkasan",
      labelEn: "Overview",
      mobileLabelId: "Ringkas",
      mobileLabelEn: "Home",
      icon: LayoutDashboard,
    },
    {
      id: "transactions",
      labelId: "Transaksi",
      labelEn: "Transactions",
      mobileLabelId: "Catatan",
      mobileLabelEn: "Ledger",
      icon: ListOrdered,
    },
    {
      id: "calendar",
      labelId: "Kalender",
      labelEn: "Calendar",
      mobileLabelId: "Kalender",
      mobileLabelEn: "Calendar",
      icon: CalendarDays,
    },
    {
      id: "scanner",
      labelId: "Scan Struk AI",
      labelEn: "AI Scanner",
      mobileLabelId: "Scan AI",
      mobileLabelEn: "Scan",
      icon: Camera,
    },
    {
      id: "budgets",
      labelId: "Budget & Hutang",
      labelEn: "Budgets & Debts",
      mobileLabelId: "Budget",
      mobileLabelEn: "Budget",
      icon: PiggyBank,
    },
    {
      id: "dreams",
      labelId: "Impian & Aset",
      labelEn: "Dreams & Assets",
      mobileLabelId: "Impian",
      mobileLabelEn: "Dreams",
      icon: Target,
    },
    {
      id: "wallets",
      labelId: "Dompet & Audit",
      labelEn: "Wallets & AI",
      mobileLabelId: "Dompet",
      mobileLabelEn: "Wallets",
      icon: WalletIcon,
    },
  ];

  const openTransactionModal = (
    defaultType: TransactionType = "expense",
    defaultDate?: string
  ) => {
    setModalDefaultType(defaultType);
    setModalDefaultDate(defaultDate);
    setIsTxModalOpen(true);
  };

  const handleAddTransaction = (newTx: Omit<Transaction, "id">) => {
    playPopChime(soundEnabled);
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      transactions: [tx, ...prev.transactions],
      wallets: prev.wallets.map((w) => {
        if (w.id !== tx.walletId) return w;
        const delta = tx.type === "income" ? tx.amount : -tx.amount;
        return { ...w, balance: w.balance + delta };
      }),
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    setState((prev) => {
      const target = prev.transactions.find((t) => t.id === id);
      if (!target) return prev;
      return {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        wallets: prev.wallets.map((w) => {
          if (w.id !== target.walletId) return w;
          const revert = target.type === "income" ? -target.amount : target.amount;
          return { ...w, balance: w.balance + revert };
        }),
      };
    });
  };

  const handleUpdateBudget = (category: CategoryId, monthlyLimit: number) => {
    playPopChime(soundEnabled);
    setState((prev) => {
      const exists = prev.budgets.some((b) => b.category === category);
      const nextBudgets = exists
        ? prev.budgets.map((b) =>
            b.category === category ? { ...b, monthlyLimit } : b
          )
        : [...prev.budgets, { category, monthlyLimit }];
      return { ...prev, budgets: nextBudgets };
    });
  };

  const handleCheckInChallenge = (id: string) => {
    playPopChime(soundEnabled);
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      challenges: prev.challenges.map((ch) =>
        ch.id === id && ch.completedDays < ch.targetDays
          ? {
              ...ch,
              completedDays: ch.completedDays + 1,
              lastCheckedDate: today,
            }
          : ch
      ),
    }));
  };

  const handleAddChallenge = (challenge: Omit<SpendingChallenge, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      challenges: [
        { ...challenge, id: `ch-${Date.now()}` },
        ...prev.challenges,
      ],
    }));
  };

  const handleDeleteChallenge = (id: string) => {
    setState((prev) => ({
      ...prev,
      challenges: prev.challenges.filter((c) => c.id !== id),
    }));
  };

  const handleAddDebt = (debt: Omit<DebtItem, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      debts: [{ ...debt, id: `db-${Date.now()}` }, ...prev.debts],
    }));
  };

  const handleToggleDebtPaid = (id: string) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === id ? { ...d, paid: !d.paid } : d)),
    }));
  };

  const handleDeleteDebt = (id: string) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  };

  const handleAddDream = (goal: Omit<DreamGoal, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      dreams: [...prev.dreams, { ...goal, id: `dr-${Date.now()}` }],
    }));
  };

  const handleContributeDream = (
    goalId: string,
    walletId: string,
    amount: number
  ) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      dreams: prev.dreams.map((d) =>
        d.id === goalId
          ? { ...d, currentAmount: Math.min(d.targetAmount, d.currentAmount + amount) }
          : d
      ),
      wallets: prev.wallets.map((w) =>
        w.id === walletId ? { ...w, balance: w.balance - amount } : w
      ),
    }));
  };

  const handleDeleteDream = (goalId: string) => {
    setState((prev) => ({
      ...prev,
      dreams: prev.dreams.filter((d) => d.id !== goalId),
    }));
  };

  const handleAddJar = (jar: Omit<SavingJar, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      jars: [{ ...jar, id: `jar-${Date.now()}` }, ...prev.jars],
    }));
  };

  const handleTopUpJar = (jarId: string, walletId: string, amount: number) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      jars: prev.jars.map((j) =>
        j.id === jarId ? { ...j, saved: Math.min(j.target, j.saved + amount) } : j
      ),
      wallets: prev.wallets.map((w) =>
        w.id === walletId ? { ...w, balance: w.balance - amount } : w
      ),
    }));
  };

  const handleDeleteJar = (jarId: string) => {
    setState((prev) => ({
      ...prev,
      jars: prev.jars.filter((j) => j.id !== jarId),
    }));
  };

  const handleAddInvestment = (asset: Omit<InvestmentAsset, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      investments: [{ ...asset, id: `inv-${Date.now()}` }, ...prev.investments],
    }));
  };

  const handleUpdateInvestmentValue = (id: string, value: number) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      investments: prev.investments.map((a) => (a.id === id ? { ...a, value } : a)),
    }));
  };

  const handleDeleteInvestment = (id: string) => {
    setState((prev) => ({
      ...prev,
      investments: prev.investments.filter((a) => a.id !== id),
    }));
  };

  const handleAddCard = (card: Omit<CreditCardItem, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      cards: [{ ...card, id: `cc-${Date.now()}` }, ...prev.cards],
    }));
  };

  const handleChargeCard = (cardId: string, amount: number) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) =>
        c.id === cardId ? { ...c, used: Math.min(c.limit, c.used + amount) } : c
      ),
    }));
  };

  const handlePayCard = (cardId: string, walletId: string, amount: number) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) =>
        c.id === cardId ? { ...c, used: Math.max(0, c.used - amount) } : c
      ),
      wallets: prev.wallets.map((w) =>
        w.id === walletId ? { ...w, balance: w.balance - amount } : w
      ),
    }));
  };

  const handleDeleteCard = (cardId: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== cardId),
    }));
  };

  const handleAddWallet = (wallet: Omit<Wallet, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      wallets: [...prev.wallets, { ...wallet, id: `w-${Date.now()}` }],
    }));
  };

  const handleTransferWallet = (fromId: string, toId: string, amount: number) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => {
        if (w.id === fromId) return { ...w, balance: w.balance - amount };
        if (w.id === toId) return { ...w, balance: w.balance + amount };
        return w;
      }),
    }));
  };

  const handleAddAutoTransfer = (rule: Omit<AutoTransferRule, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      autoTransfers: [{ ...rule, id: `at-${Date.now()}` }, ...prev.autoTransfers],
    }));
  };

  const handleRunAutoTransfer = (id: string) => {
    playPopChime(soundEnabled);
    setState((prev) => {
      const rule = prev.autoTransfers.find((r) => r.id === id);
      if (!rule) return prev;
      return {
        ...prev,
        wallets: prev.wallets.map((w) => {
          if (w.id === rule.fromWalletId) return { ...w, balance: w.balance - rule.amount };
          if (w.id === rule.toWalletId) return { ...w, balance: w.balance + rule.amount };
          return w;
        }),
      };
    });
  };

  const handleDeleteAutoTransfer = (id: string) => {
    setState((prev) => ({
      ...prev,
      autoTransfers: prev.autoTransfers.filter((r) => r.id !== id),
    }));
  };

  const handleAddRecurringRule = (
    ruleInput: Omit<RecurringTransactionRule, "id">,
    startNextMonth: boolean
  ) => {
    playPopChime(soundEnabled);
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const newRule: RecurringTransactionRule = {
      ...ruleInput,
      id: `rec-${Date.now()}`,
      lastGeneratedMonth: startNextMonth ? currentMonthKey : undefined,
    };

    setState((prev) => {
      const nextRules = [newRule, ...prev.recurringRules];
      const result = reconcileDueRecurring(
        nextRules,
        prev.wallets,
        prev.transactions,
        prev.language,
        now
      );
      if (result.postedMerchants.length > 0) {
        setAutoPostedNotice(
          prev.language === "en"
            ? `${result.postedMerchants[0]} was due this month and automatically added to the ledger.`
            : `${result.postedMerchants[0]} sudah melewati tanggal jadwal bulan ini dan otomatis dicatat ke ledger.`
        );
      }
      return {
        ...prev,
        recurringRules: result.rules,
        wallets: result.wallets,
        transactions: result.transactions,
      };
    });
  };

  const handleToggleRecurringRule = (id: string) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      recurringRules: prev.recurringRules.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r
      ),
    }));
  };

  const handleRunRecurringNow = (id: string) => {
    playPopChime(soundEnabled);
    setState((prev) => {
      const rule = prev.recurringRules.find((r) => r.id === id);
      if (!rule) return prev;
      const [yStr, mStr] = selectedMonth.split("-");
      const daysInSel = new Date(Number(yStr), Number(mStr), 0).getDate() || 30;
      const effDay = Math.min(Math.max(1, rule.dayOfMonth), daysInSel);
      const txDate = `${selectedMonth}-${String(effDay).padStart(2, "0")}`;
      const newTx: Transaction = {
        id: `rec-tx-${rule.id}-${selectedMonth}-${Date.now()}`,
        merchant: rule.merchant,
        amount: rule.amount,
        type: rule.type,
        category: rule.category,
        walletId: rule.walletId,
        date: txDate,
        notes:
          rule.notes ||
          (prev.language === "en"
            ? "Auto-scheduled monthly"
            : "Jadwal rutin bulanan"),
        source: "recurring",
      };
      const delta = rule.type === "income" ? rule.amount : -rule.amount;
      const nextGeneratedMonth =
        !rule.lastGeneratedMonth || selectedMonth > rule.lastGeneratedMonth
          ? selectedMonth
          : rule.lastGeneratedMonth;

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        wallets: prev.wallets.map((w) =>
          w.id === rule.walletId ? { ...w, balance: w.balance + delta } : w
        ),
        recurringRules: prev.recurringRules.map((r) =>
          r.id === id ? { ...r, lastGeneratedMonth: nextGeneratedMonth } : r
        ),
      };
    });
  };

  const handleDeleteRecurringRule = (id: string) => {
    setState((prev) => ({
      ...prev,
      recurringRules: prev.recurringRules.filter((r) => r.id !== id),
    }));
  };

  const handleUpdateWidget = (patch: {
    widgetTheme?: WidgetTheme;
    widgetShape?: WidgetShape;
    companionName?: string;
    companionAvatarUrl?: string;
  }) => {
    setState((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const handleAddCustomCategory = (cat: Omit<CustomCategory, "id">) => {
    playPopChime(soundEnabled);
    setState((prev) => ({
      ...prev,
      customCategories: [
        ...prev.customCategories,
        { ...cat, id: `cat-${Date.now()}` },
      ],
    }));
  };

  const handleDeleteCustomCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      customCategories: prev.customCategories.filter((c) => c.id !== id),
    }));
  };

  const handleExportBackup = () => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mucuw-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonText: string) => {
    const parsed = JSON.parse(jsonText) as Partial<PersistedState>;
    if (!parsed.wallets || !Array.isArray(parsed.wallets)) {
      throw new Error("Invalid backup structure");
    }
    setState({
      ...getDefaultState(),
      ...parsed,
    });
    playPopChime(soundEnabled);
  };

  const handleResetDemoData = () => {
    setState(getDefaultState());
    setSelectedMonth("2026-11");
    setSelectedWalletFilter("all");
  };

  const currentNav = navItems.find((n) => n.id === activeTab) ?? navItems[0];

  const shellCanvasClass =
    appTheme === "dark"
      ? "bg-[#090D10] text-slate-100"
      : appTheme === "plain"
        ? "bg-[#F4F7FB] text-slate-900"
        : appTheme === "bold"
          ? "bg-[#FFF9EB] text-[#241F35]"
          : "bg-gradient-to-br from-[#F3ECFF] via-[#FCF8FF] to-[#E6FAF0] text-[#241F35]";

  return (
    <div className={`relative min-h-screen ${shellCanvasClass}`}>
      {/* Ambient Soft Pastel Aura for Glassmorphism */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-28 -left-24 h-96 w-96 rounded-full bg-[#FFD6EA]/60 blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute top-1/3 -right-28 h-[28rem] w-[28rem] rounded-full bg-[#CFE7FF]/65 blur-3xl dark:bg-purple-900/20" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-[#CFF7E3]/65 blur-3xl dark:bg-sky-900/20" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop Frosted Glass Sidebar */}
        <aside className="glass-panel hidden w-64 shrink-0 flex-col justify-between border-r border-white/75 p-5 dark:border-white/10 lg:flex">
          <div>
            <div className="flex items-center justify-between px-2 pb-6">
              <a
                href="#overview"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("overview");
                }}
                className="inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-[#241F35] dark:text-white whitespace-nowrap"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 36 36"
                  className="h-8 w-8 shrink-0"
                >
                  <circle cx="11" cy="10" r="5" fill="#F9B8D0" />
                  <circle cx="25" cy="10" r="5" fill="#F9B8D0" />
                  <rect
                    x="5"
                    y="10"
                    width="26"
                    height="21"
                    rx="10.5"
                    fill="#FFF7FA"
                    stroke="#241F35"
                    strokeWidth="2"
                  />
                  <circle cx="13.5" cy="19" r="1.7" fill="#241F35" />
                  <circle cx="22.5" cy="19" r="1.7" fill="#241F35" />
                  <ellipse cx="10.5" cy="22" rx="2.3" ry="1.2" fill="#FF9EC6" />
                  <ellipse cx="25.5" cy="22" rx="2.3" ry="1.2" fill="#FF9EC6" />
                  <path
                    d="M16 21.5 Q18 23.5 20 21.5"
                    fill="none"
                    stroke="#241F35"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Mucuw</span>
              </a>
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                title={language === "en" ? "Profile & Theme" : "Profil & Tema"}
                aria-label="Profil & Pengaturan"
                className="glass-soft rounded-xl p-1.5 text-slate-600 transition-transform hover:scale-105 hover:text-[#241F35] dark:text-slate-300 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <nav aria-label="Menu Utama" className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? "bg-white/85 text-[#241F35] shadow-sm ring-1 ring-[#241F35]/8 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-400/25"
                        : "text-slate-600 hover:bg-white/50 hover:text-[#241F35] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{language === "en" ? item.labelEn : item.labelId}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2.5 border-t border-white/60 pt-4 dark:border-white/10">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setState((p) => ({
                    ...p,
                    language: p.language === "id" ? "en" : "id",
                  }))
                }
                className="glass-soft flex-1 rounded-xl py-1.5 text-xs font-semibold text-slate-700 transition-transform active:scale-95 dark:text-slate-200 whitespace-nowrap cursor-pointer"
              >
                {language === "id" ? "Bahasa: ID" : "Language: EN"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setState((p) => ({
                    ...p,
                    currency: p.currency === "IDR" ? "USD" : "IDR",
                  }))
                }
                className="glass-soft flex-1 rounded-xl py-1.5 font-mono text-xs font-semibold text-slate-700 transition-transform active:scale-95 dark:text-slate-200 whitespace-nowrap cursor-pointer"
              >
                {currency}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setState((p) => ({
                    ...p,
                    appTheme: p.appTheme === "dark" ? "pastel" : "dark",
                  }))
                }
                className="glass-soft flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold text-slate-700 transition-transform active:scale-95 dark:text-slate-200 whitespace-nowrap cursor-pointer"
              >
                {appTheme === "dark" ? (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    <span>Pastel</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Gelap</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleResetDemoData}
                title={
                  language === "en" ? "Reset sample data" : "Reset data contoh"
                }
                className="glass-soft inline-flex items-center justify-center rounded-xl px-2.5 py-1.5 text-xs text-slate-600 transition-transform active:scale-95 dark:text-slate-300 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          {/* Frosted Glass Top Bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/70 bg-white/60 px-4 py-3.5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0F1619]/70 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="font-display text-lg font-bold text-[#241F35] dark:text-white lg:hidden">
                Mucuw
              </span>
              <span className="hidden text-sm font-semibold text-[#241F35] dark:text-slate-100 lg:inline">
                {language === "en" ? currentNav.labelEn : currentNav.labelId}
              </span>
              <span
                aria-hidden="true"
                className="hidden text-slate-300 dark:text-slate-700 lg:inline"
              >
                /
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Pilih Bulan"
                className="glass-soft rounded-xl px-2.5 py-1 font-mono text-xs text-[#241F35] outline-none dark:text-slate-200"
              />
              <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:inline">
                {formatMonthLabel(selectedMonth, language)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PWAInstallButton language={language} variant="header" />

              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                aria-label="Profil & Pengaturan"
                className="glass-soft inline-flex items-center justify-center rounded-xl p-2 text-[#241F35] transition-transform hover:scale-105 dark:text-slate-200 lg:hidden cursor-pointer"
              >
                <Settings className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setState((p) => ({ ...p, privacyMode: !p.privacyMode }))
                }
                title={
                  privacyMode
                    ? language === "en"
                      ? "Show balances"
                      : "Tampilkan nominal"
                    : language === "en"
                      ? "Hide balances"
                      : "Sembunyikan nominal"
                }
                aria-label={
                  privacyMode ? "Tampilkan nominal" : "Sembunyikan nominal"
                }
                className="glass-soft inline-flex items-center justify-center rounded-xl p-2 text-[#241F35] transition-transform hover:scale-105 dark:text-slate-200 cursor-pointer"
              >
                {privacyMode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => openTransactionModal("expense")}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#241F35] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-500 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {language === "en" ? "Log Entry" : "Catat Transaksi"}
                </span>
              </button>
            </div>
          </header>

          {/* Content Container */}
          <main className="mx-auto w-full max-w-[1200px] flex-1 p-4 sm:p-8">
            {activeTab === "overview" && (
              <OverviewView
                userName={userName}
                wallets={wallets}
                selectedWalletFilter={selectedWalletFilter}
                onSelectWalletFilter={setSelectedWalletFilter}
                transactions={transactions}
                budgets={budgets}
                dreams={dreams}
                jars={jars}
                challenges={challenges}
                customCategories={customCategories}
                selectedMonth={selectedMonth}
                currency={currency}
                language={language}
                privacyMode={privacyMode}
                onTogglePrivacy={() =>
                  setState((p) => ({ ...p, privacyMode: !p.privacyMode }))
                }
                widgetTheme={widgetTheme}
                widgetShape={widgetShape}
                companionName={companionName}
                companionAvatarUrl={companionAvatarUrl}
                onUpdateWidget={handleUpdateWidget}
                onNavigate={setActiveTab}
                onOpenNewTx={openTransactionModal}
                onOpenProfile={() => setIsProfileOpen(true)}
              />
            )}

            {activeTab === "transactions" && (
              <TransactionsView
                transactions={transactions}
                wallets={wallets}
                recurringRules={recurringRules}
                customCategories={customCategories}
                selectedMonth={selectedMonth}
                currency={currency}
                language={language}
                privacyMode={privacyMode}
                autoPostedNotice={autoPostedNotice}
                onDismissAutoPostedNotice={() => setAutoPostedNotice(null)}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddRecurringRule={handleAddRecurringRule}
                onToggleRecurringRule={handleToggleRecurringRule}
                onRunRecurringNow={handleRunRecurringNow}
                onDeleteRecurringRule={handleDeleteRecurringRule}
                onOpenModal={() => openTransactionModal("expense")}
              />
            )}

            {activeTab === "calendar" && (
              <CalendarView
                transactions={transactions}
                wallets={wallets}
                recurringRules={recurringRules}
                customCategories={customCategories}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                currency={currency}
                language={language}
                privacyMode={privacyMode}
                onDeleteTransaction={handleDeleteTransaction}
                onOpenNewTx={openTransactionModal}
              />
            )}

            {activeTab === "scanner" && (
              <ScannerView
                wallets={wallets}
                customCategories={customCategories}
                currency={currency}
                language={language}
                onSaveTransaction={handleAddTransaction}
                onScanComplete={() => setActiveTab("transactions")}
              />
            )}

            {activeTab === "budgets" && (
              <BudgetsChallengesView
                budgets={budgets}
                transactions={transactions}
                challenges={challenges}
                debts={debts}
                customCategories={customCategories}
                selectedMonth={selectedMonth}
                currency={currency}
                language={language}
                privacyMode={privacyMode}
                onUpdateBudget={handleUpdateBudget}
                onCheckInChallenge={handleCheckInChallenge}
                onAddChallenge={handleAddChallenge}
                onDeleteChallenge={handleDeleteChallenge}
                onAddDebt={handleAddDebt}
                onToggleDebtPaid={handleToggleDebtPaid}
                onDeleteDebt={handleDeleteDebt}
              />
            )}

            {activeTab === "dreams" && (
              <DreamsView
                dreams={dreams}
                jars={jars}
                investments={investments}
                cards={cards}
                wallets={wallets}
                currency={currency}
                language={language}
                privacyMode={privacyMode}
                onAddDream={handleAddDream}
                onContributeDream={handleContributeDream}
                onDeleteDream={handleDeleteDream}
                onAddJar={handleAddJar}
                onTopUpJar={handleTopUpJar}
                onDeleteJar={handleDeleteJar}
                onAddInvestment={handleAddInvestment}
                onUpdateInvestmentValue={handleUpdateInvestmentValue}
                onDeleteInvestment={handleDeleteInvestment}
                onAddCard={handleAddCard}
                onChargeCard={handleChargeCard}
                onPayCard={handlePayCard}
                onDeleteCard={handleDeleteCard}
              />
            )}

            {activeTab === "wallets" && (
              <WalletsReportsView
                wallets={wallets}
                transactions={transactions}
                budgets={budgets}
                dreams={dreams}
                autoTransfers={autoTransfers}
                customCategories={customCategories}
                selectedMonth={selectedMonth}
                currency={currency}
                language={language}
                privacyMode={privacyMode}
                onAddWallet={handleAddWallet}
                onTransferWallet={handleTransferWallet}
                onAddAutoTransfer={handleAddAutoTransfer}
                onRunAutoTransfer={handleRunAutoTransfer}
                onDeleteAutoTransfer={handleDeleteAutoTransfer}
              />
            )}
          </main>
        </div>
      </div>

      {/* Compact 5-Column Kawaii Mobile Bottom Dock */}
      <MobileBottomNav
        activeTab={activeTab}
        language={language}
        onSelectTab={setActiveTab}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleAddTransaction}
        wallets={wallets}
        language={language}
        customCategories={customCategories}
        initialData={{ type: modalDefaultType, date: modalDefaultDate }}
      />

      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        appTheme={appTheme}
        language={language}
        currency={currency}
        soundEnabled={soundEnabled}
        customCategories={customCategories}
        onUpdateProfile={(patch) =>
          setState((prev) => ({ ...prev, ...patch }))
        }
        onAddCustomCategory={handleAddCustomCategory}
        onDeleteCustomCategory={handleDeleteCustomCategory}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetAll={() => {
          handleResetDemoData();
          setIsProfileOpen(false);
        }}
      />

      <OfflineIndicator language={language} />
    </div>
  );
}
