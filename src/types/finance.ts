export type Language = "id" | "en";
export type Currency = "IDR" | "USD";
export type AppThemeMode = "pastel" | "plain" | "bold" | "dark";
export type WidgetTheme = "mint" | "butter" | "sky" | "lilac";
export type WidgetShape = "square" | "circle" | "cloud";

export type TabId =
  | "overview"
  | "transactions"
  | "calendar"
  | "scanner"
  | "budgets"
  | "dreams"
  | "wallets";

export type CategoryId =
  | "makan"
  | "kopi"
  | "transport"
  | "belanja"
  | "tagihan"
  | "hiburan"
  | "kesehatan"
  | "pendidikan"
  | "gaji"
  | "freelance"
  | "lainnya"
  | (string & {});

export type TransactionType = "expense" | "income";

export type WalletType = "bank" | "ewallet" | "cash" | "savings";

export interface CustomCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  accountHint?: string;
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  walletId: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  source?: "manual" | "ai-scan" | "recurring";
}

export interface Budget {
  category: CategoryId;
  monthlyLimit: number;
}

export interface SpendingChallenge {
  id: string;
  title: string;
  description: string;
  targetDays: number;
  completedDays: number;
  estimatedSaving: number;
  lastCheckedDate?: string;
  active: boolean;
}

export interface DreamGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyTarget: number;
  deadlineMonth: string;
}

export interface SavingJar {
  id: string;
  name: string;
  target: number;
  saved: number;
}

export interface InvestmentAsset {
  id: string;
  name: string;
  assetType: string;
  cost: number;
  value: number;
}

export interface CreditCardItem {
  id: string;
  name: string;
  limit: number;
  used: number;
  dueDateDay: number;
}

export interface DebtItem {
  id: string;
  person: string;
  amount: number;
  kind: "hutang" | "piutang";
  dueDate?: string;
  paid: boolean;
  note?: string;
}

export interface AutoTransferRule {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  freq: "weekly" | "monthly";
  nextDate: string;
  active: boolean;
}

export interface RecurringTransactionRule {
  id: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  walletId: string;
  dayOfMonth: number; // 1..31
  notes?: string;
  active: boolean;
  lastGeneratedMonth?: string; // YYYY-MM
}

export interface AiInsightResult {
  headline: string;
  mucuwMood: "happy" | "alert" | "worried";
  mucuwSpeech: string;
  leakAlert: string;
  actionableTips: Array<{
    title: string;
    detail: string;
    estimatedMonthlySaving: number;
  }>;
}

export interface ReceiptScanResult {
  merchant: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  date: string;
  notes: string;
  suggestedWallet?: string;
  mucuwComment: string;
  confidence: number;
}
