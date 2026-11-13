import {
  CategoryId,
  Currency,
  CustomCategory,
  Language,
  WalletType,
} from "../types/finance";

export interface CategoryMeta {
  id: CategoryId;
  labelId: string;
  labelEn: string;
  color: string;
  defaultType: "expense" | "income";
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  makan: {
    id: "makan",
    labelId: "Makan & Minum",
    labelEn: "Food & Dining",
    color: "#10B981",
    defaultType: "expense",
  },
  kopi: {
    id: "kopi",
    labelId: "Kopi & Jajan",
    labelEn: "Coffee & Snacks",
    color: "#F59E0B",
    defaultType: "expense",
  },
  transport: {
    id: "transport",
    labelId: "Transportasi",
    labelEn: "Transport",
    color: "#0EA5E9",
    defaultType: "expense",
  },
  belanja: {
    id: "belanja",
    labelId: "Belanja",
    labelEn: "Shopping",
    color: "#EC4899",
    defaultType: "expense",
  },
  tagihan: {
    id: "tagihan",
    labelId: "Tagihan & Utilitas",
    labelEn: "Bills & Utilities",
    color: "#6366F1",
    defaultType: "expense",
  },
  hiburan: {
    id: "hiburan",
    labelId: "Hiburan",
    labelEn: "Entertainment",
    color: "#8B5CF6",
    defaultType: "expense",
  },
  kesehatan: {
    id: "kesehatan",
    labelId: "Kesehatan",
    labelEn: "Health",
    color: "#14B8A6",
    defaultType: "expense",
  },
  pendidikan: {
    id: "pendidikan",
    labelId: "Edukasi & Buku",
    labelEn: "Education",
    color: "#3B82F6",
    defaultType: "expense",
  },
  gaji: {
    id: "gaji",
    labelId: "Gaji Utama",
    labelEn: "Salary",
    color: "#16A34A",
    defaultType: "income",
  },
  freelance: {
    id: "freelance",
    labelId: "Freelance & Bonus",
    labelEn: "Freelance & Bonus",
    color: "#059669",
    defaultType: "income",
  },
  lainnya: {
    id: "lainnya",
    labelId: "Lainnya",
    labelEn: "Others",
    color: "#64748B",
    defaultType: "expense",
  },
};

export const EXPENSE_CATEGORIES: CategoryId[] = [
  "makan",
  "kopi",
  "transport",
  "belanja",
  "tagihan",
  "hiburan",
  "kesehatan",
  "pendidikan",
  "lainnya",
];

export const INCOME_CATEGORIES: CategoryId[] = ["gaji", "freelance", "lainnya"];

export function getCategoryLabel(
  id: CategoryId,
  lang: Language,
  customCategories: CustomCategory[] = []
): string {
  const custom = customCategories.find((c) => c.id === id);
  if (custom) return custom.name;
  const cat = CATEGORIES[id] ?? CATEGORIES.lainnya;
  return lang === "en" ? cat.labelEn : cat.labelId;
}

export function getCategoryColor(
  id: CategoryId,
  customCategories: CustomCategory[] = []
): string {
  const custom = customCategories.find((c) => c.id === id);
  if (custom) return custom.color;
  return (CATEGORIES[id] ?? CATEGORIES.lainnya).color;
}

export function getWalletTypeLabel(type: WalletType, lang: Language): string {
  const map: Record<WalletType, { id: string; en: string }> = {
    bank: { id: "Rekening Bank", en: "Bank Account" },
    ewallet: { id: "Dompet Digital", en: "E-Wallet" },
    cash: { id: "Uang Tunai", en: "Cash" },
    savings: { id: "Tabungan", en: "Savings" },
  };
  return map[type][lang];
}

const USD_RATE = 15850;

export function formatCurrency(
  amountIdr: number,
  currency: Currency = "IDR",
  masked = false
): string {
  if (masked) {
    return currency === "USD" ? "$ •••••" : "Rp ••••••";
  }
  if (currency === "USD") {
    const usd = amountIdr / USD_RATE;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usd);
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(amountIdr));
}

export function formatShortDate(dateStr: string, lang: Language): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthLabel(monthKey: string, lang: Language): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return monthKey;
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
    month: "long",
    year: "numeric",
  });
}
