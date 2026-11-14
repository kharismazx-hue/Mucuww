import { ChangeEvent, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Award,
  LayoutGrid,
  Mail,
  Palette,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
  Wallet as WalletIcon,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Currency,
  Language,
  TransactionType,
  Wallet,
  WidgetShape,
  WidgetTheme,
} from "../types/finance";
import { MOCHI_QUOTES_EN, MOCHI_QUOTES_ID } from "../data/seedData";
import { formatCurrency } from "../utils/format";

interface MascotBannerProps {
  userName: string;
  wallets: Wallet[];
  selectedWalletFilter: string;
  onSelectWalletFilter: (walletId: string) => void;
  totalBalance: number;
  scopedIncome: number;
  scopedExpense: number;
  budgetRatio: number;
  dailySafeLimit: number;
  remainingBudget: number;
  savingsRate: number;
  streakDays: number;
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
  onQuickLog: (type: TransactionType) => void;
  onOpenScanner: () => void;
  onOpenTransfer: () => void;
  onOpenAiInsights: () => void;
  onOpenProfile: () => void;
  onUpdateWalletBalance?: (walletId: string, newBalance: number) => void;
  onDeleteWallet?: (walletId: string) => void;
}

const WIDGET_THEMES: Record<
  WidgetTheme,
  {
    label: string;
    heroBg: string;
  }
> = {
  mint: {
    label: "Mint",
    heroBg:
      "from-[#5B7B7A]/90 via-[#6F9689]/85 to-[#5E8C6E]/90 dark:from-[#12261F]/90 dark:via-[#162C25]/90 dark:to-[#0F201A]/90",
  },
  butter: {
    label: "Butter",
    heroBg:
      "from-[#6A6E82]/90 via-[#848375]/85 to-[#7E8562]/90 dark:from-[#262011]/90 dark:via-[#211C12]/90 dark:to-[#19160D]/90",
  },
  sky: {
    label: "Sky",
    heroBg:
      "from-[#5C798C]/90 via-[#6D909A]/85 to-[#678E75]/90 dark:from-[#132230]/90 dark:via-[#16262F]/90 dark:to-[#11231E]/90",
  },
  lilac: {
    label: "Lilac",
    heroBg:
      "from-[#716991]/90 via-[#88769C]/85 to-[#7A6B8E]/90 dark:from-[#23192E]/90 dark:via-[#1E1729]/90 dark:to-[#241621]/90",
  },
};

const SHAPE_CLASSES: Record<WidgetShape, string> = {
  square: "rounded-2xl",
  circle: "rounded-full",
  cloud: "rounded-[58%_42%_55%_45%/48%_58%_42%_52%]",
};

function CuteMochiAvatar({
  src,
  name,
  shapeClass,
}: {
  src?: string;
  name: string;
  shapeClass: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`h-full w-full object-cover ${shapeClass}`}
      />
    );
  }

  return (
    <svg viewBox="0 0 36 36" className="h-full w-full p-1" aria-hidden="true">
      <circle cx="11" cy="10" r="4.8" fill="#F9B8D0" />
      <circle cx="25" cy="10" r="4.8" fill="#F9B8D0" />
      <rect
        x="5"
        y="10"
        width="26"
        height="21"
        rx="10.5"
        fill="#FFF7FA"
        stroke="#241F35"
        strokeWidth="1.8"
      />
      <circle cx="13.5" cy="19" r="1.6" fill="#241F35" />
      <circle cx="22.5" cy="19" r="1.6" fill="#241F35" />
      <ellipse cx="10.5" cy="22" rx="2.2" ry="1.1" fill="#FF9EC6" />
      <ellipse cx="25.5" cy="22" rx="2.2" ry="1.1" fill="#FF9EC6" />
      <path
        d="M16 21.5 Q18 23.5 20 21.5"
        fill="none"
        stroke="#241F35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MascotBanner({
  userName,
  wallets,
  selectedWalletFilter,
  onSelectWalletFilter,
  totalBalance,
  scopedIncome,
  scopedExpense,
  budgetRatio,
  dailySafeLimit,
  savingsRate,
  streakDays,
  currency,
  language,
  privacyMode,
  onTogglePrivacy,
  widgetTheme,
  widgetShape,
  companionName,
  companionAvatarUrl,
  onUpdateWidget,
  onQuickLog,
  onOpenTransfer,
  onOpenProfile,
  onUpdateWalletBalance,
  onDeleteWallet,
}: MascotBannerProps) {
  const [customizing, setCustomizing] = useState(false);
  const [walletManagerOpen, setWalletManagerOpen] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string>("");
  const [editBalanceInput, setEditBalanceInput] = useState<string>("");
  const [quoteIdx, setQuoteIdx] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const mood: "happy" | "alert" | "worried" =
    budgetRatio >= 0.95 ? "worried" : budgetRatio >= 0.7 ? "alert" : "happy";

  const activeName = companionName.trim() || "Mucuw";
  const quotes = language === "en" ? MOCHI_QUOTES_EN : MOCHI_QUOTES_ID;
  const activeQuote = quotes[quoteIdx % quotes.length];

  const themeStyle = WIDGET_THEMES[widgetTheme] ?? WIDGET_THEMES.sky;
  const currentWallet =
    selectedWalletFilter === "all"
      ? wallets[0]
      : wallets.find((w) => w.id === selectedWalletFilter) ?? wallets[0];

  const handleOpenWalletEdit = () => {
    const target = currentWallet;
    if (!target) return;
    setEditingWalletId(target.id);
    setEditBalanceInput(String(target.balance));
    setWalletManagerOpen(true);
  };

  const handleSelectEditWallet = (id: string) => {
    setEditingWalletId(id);
    const found = wallets.find((w) => w.id === id);
    setEditBalanceInput(found ? String(found.balance) : "0");
  };

  const handleSaveWalletBalance = () => {
    if (!editingWalletId || !onUpdateWalletBalance) return;
    const numeric = Number(editBalanceInput.replace(/[^\d.-]/g, "")) || 0;
    onUpdateWalletBalance(editingWalletId, numeric);
    setWalletManagerOpen(false);
  };

  const handleClearWalletBalance = () => {
    if (!editingWalletId || !onUpdateWalletBalance) return;
    onUpdateWalletBalance(editingWalletId, 0);
    setEditBalanceInput("0");
    setWalletManagerOpen(false);
  };

  const handleRemoveWallet = () => {
    if (!editingWalletId || !onDeleteWallet || wallets.length <= 1) return;
    onDeleteWallet(editingWalletId);
    setWalletManagerOpen(false);
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpdateWidget({ companionAvatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const totalAllWallets = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="space-y-4">
      {/* HERO FROSTED GLASS CONTAINER (Matching Reference Aesthetic) */}
      <section
        aria-label="Kartu Utama Mucuw"
        className={`relative overflow-hidden rounded-[28px] border border-white/55 bg-gradient-to-br ${themeStyle.heroBg} p-4 text-white shadow-[0_18px_40px_-14px_rgba(36,31,53,0.35),inset_0_1px_1px_rgba(255,255,255,0.45)] backdrop-blur-2xl`}
      >
        {/* Soft Ambient Glow Orbs Inside Hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/15 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-emerald-300/20 blur-2xl"
        />

        {/* Row 1: Greeting + Avatar Profile Button */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold tracking-tight text-white truncate">
              Halo, {userName || "Teman"}! 👋
            </h1>
            <p className="mt-0.5 text-xs text-white/80">
              {language === "en"
                ? "Let's check your money today"
                : "Yuk cek uang kamu hari ini"}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            title={language === "en" ? "Profile & Theme" : "Profil & Tema"}
            aria-label="Profil & Tema"
            className={`relative h-12 w-12 shrink-0 overflow-hidden border-2 border-white/80 bg-white/85 shadow-md transition-transform active:scale-95 cursor-pointer ${SHAPE_CLASSES[widgetShape] === "rounded-2xl" ? "rounded-full" : SHAPE_CLASSES[widgetShape]}`}
          >
            <CuteMochiAvatar
              src={companionAvatarUrl}
              name={activeName}
              shapeClass="rounded-full"
            />
          </button>
        </div>

        {/* Row 2: Total Aset + Widget Toggle Button */}
        <div className="relative z-10 mt-3.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/75">
              <WalletIcon className="h-3 w-3 text-amber-300" />
              <span>{language === "en" ? "TOTAL ASSETS" : "TOTAL ASET"}</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                {streakDays}d 🔥
              </span>
            </div>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-white truncate">
              {formatCurrency(totalAllWallets, currency, privacyMode)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCustomizing((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>{language === "en" ? "Widget" : "Widget"}</span>
          </button>
        </div>

        {/* Collapsible Widget Customizer */}
        {customizing && (
          <div className="relative z-10 mt-3 space-y-2.5 rounded-2xl border border-white/35 bg-black/20 p-3 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1">
                {(["square", "circle", "cloud"] as WidgetShape[]).map((sh) => (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => onUpdateWidget({ widgetShape: sh })}
                    className={`rounded-lg px-2 py-1 text-[10px] font-semibold cursor-pointer ${
                      widgetShape === sh
                        ? "bg-white text-[#241F35]"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {sh === "square" ? "Kotak" : sh === "circle" ? "Bulat" : "Awan"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {(Object.keys(WIDGET_THEMES) as WidgetTheme[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onUpdateWidget({ widgetTheme: key })}
                    className={`rounded-lg px-2 py-1 text-[10px] font-semibold cursor-pointer ${
                      widgetTheme === key
                        ? "bg-emerald-400 text-[#241F35]"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {WIDGET_THEMES[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={companionName}
                onChange={(e) => onUpdateWidget({ companionName: e.target.value })}
                placeholder="Nama maskot (Mucuw)"
                className="min-w-0 flex-1 rounded-xl border border-white/30 bg-white/20 px-2.5 py-1.5 text-xs text-white placeholder:text-white/60 outline-none"
              />
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-white/35 bg-white/25 px-2.5 py-1.5 text-[11px] font-semibold text-white whitespace-nowrap">
                <Upload className="h-3 w-3" />
                <span>{language === "en" ? "Photo" : "Foto"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="sr-only"
                />
              </label>
              {companionAvatarUrl && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateWidget({
                      companionAvatarUrl: "",
                      companionName: "Mucuw",
                    })
                  }
                  className="rounded-xl border border-white/35 bg-white/20 p-1.5 text-white cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* CENTER FLOATING FROSTED GLASS PICNIC/SKY WALLET CARD */}
        <div className="relative z-10 mt-4 overflow-hidden rounded-[24px] border border-white/65 bg-white/22 p-4 shadow-[0_14px_30px_-10px_rgba(15,23,42,0.3),inset_0_1px_1px_rgba(255,255,255,0.65)] backdrop-blur-xl">
          {/* Soft Scenic Pastel Sky & Meadow Illustration inside Card */}
          <svg
            aria-hidden="true"
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
          >
            <defs>
              <linearGradient id="glassSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.65" />
                <stop offset="65%" stopColor="#E0F2FE" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#86EFAC" stopOpacity="0.65" />
              </linearGradient>
            </defs>
            <rect width="400" height="220" fill="url(#glassSky)" />
            <ellipse cx="75" cy="48" rx="46" ry="16" fill="#FFFFFF" opacity="0.65" />
            <ellipse cx="320" cy="40" rx="52" ry="18" fill="#FFFFFF" opacity="0.6" />
            <path d="M0 145 Q120 110 240 142 T400 130 V220 H0 Z" fill="#86EFAC" opacity="0.55" />
            <path d="M0 175 Q160 150 290 176 T400 164 V220 H0 Z" fill="#4ADE80" opacity="0.45" />
          </svg>

          {/* Card Top Row: Wallet Pill + Edit/Delete Pencil + Eye */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <select
                value={selectedWalletFilter}
                onChange={(e) => onSelectWalletFilter(e.target.value)}
                aria-label="Pilih Dompet"
                className="max-w-[165px] truncate rounded-full border border-white/40 bg-[#1E293B]/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md outline-none cursor-pointer"
              >
                <option value="all" className="text-slate-900">
                  {language === "en" ? "All Wallets" : "Semua Dompet"}
                </option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} className="text-slate-900">
                    {w.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleOpenWalletEdit}
                title={language === "en" ? "Edit or delete wallet" : "Edit / Hapus Dompet"}
                aria-label="Edit atau Hapus Dompet"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/30 text-white backdrop-blur-md transition-transform active:scale-95 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onTogglePrivacy}
              aria-label={privacyMode ? "Tampilkan saldo" : "Sembunyikan saldo"}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/30 text-white backdrop-blur-md transition-transform active:scale-95 cursor-pointer"
            >
              {privacyMode ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Center Hero Balance */}
          <div className="relative z-10 my-5 text-center">
            <p className="font-mono text-3xl font-extrabold tracking-tight text-white drop-shadow-sm tabular-nums">
              {formatCurrency(totalBalance, currency, privacyMode)}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/20 px-3 py-1 text-[10px] font-semibold text-white/95 backdrop-blur-md">
              <span className="text-emerald-200">
                +{formatCurrency(scopedIncome, currency, privacyMode)}
              </span>
              <span className="opacity-50">|</span>
              <span className="text-rose-200">
                -{formatCurrency(scopedExpense, currency, privacyMode)}
              </span>
            </div>
          </div>

          {/* Center Glass CTA Button ("Lihat Detail >>") */}
          <div className="relative z-10 flex justify-center">
            <button
              type="button"
              onClick={onOpenTransfer}
              className="rounded-full border border-white/80 bg-white/75 px-5 py-1.5 text-xs font-bold text-[#241F35] shadow-sm backdrop-blur-md transition-transform active:scale-95 cursor-pointer"
            >
              {language === "en" ? "View Details >>" : "Lihat Detail >>"}
            </button>
          </div>

          <p className="relative z-10 mt-2.5 text-center text-[10px] font-semibold text-white/90 drop-shadow-xs">
            {language === "en" ? "Safe daily limit:" : "Jatah aman harian:"}{" "}
            <span className="font-mono">
              {formatCurrency(Math.max(0, dailySafeLimit), currency, privacyMode)}
            </span>{" "}
            · {mood === "happy" ? "Dompet Adem" : mood === "alert" ? "Waspada" : "Hemat!"}
          </p>
        </div>
      </section>

      {/* WALLET EDIT / RESET BALANCE / DELETE MODAL */}
      {walletManagerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs"
          onClick={() => setWalletManagerOpen(false)}
        >
          <div
            className="glass-modal w-full max-w-[380px] rounded-3xl p-5 text-[#241F35] dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">
                {language === "en" ? "Manage Wallet" : "Kelola & Hapus Dompet"}
              </h3>
              <button
                type="button"
                onClick={() => setWalletManagerOpen(false)}
                className="rounded-full p-1.5 text-slate-500 hover:bg-white/60 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {language === "en" ? "Select Wallet" : "Pilih Dompet"}
                </label>
                <select
                  value={editingWalletId}
                  onChange={(e) => handleSelectEditWallet(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/70 bg-white/75 px-3 py-2 text-xs font-semibold text-[#241F35] outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance, currency, false)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {language === "en" ? "Edit Balance" : "Ubah Nominal Saldo"}
                </label>
                <input
                  type="number"
                  value={editBalanceInput}
                  onChange={(e) => setEditBalanceInput(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/70 bg-white/75 px-3 py-2 font-mono text-sm font-bold text-[#241F35] outline-none dark:border-white/15 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveWalletBalance}
                  className="w-full rounded-2xl bg-[#241F35] py-2.5 text-xs font-bold text-white transition-transform active:scale-95 dark:bg-emerald-600 cursor-pointer"
                >
                  {language === "en" ? "Save Balance" : "Simpan Saldo Baru"}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleClearWalletBalance}
                    className="rounded-2xl border border-amber-300 bg-amber-100/80 py-2 text-xs font-bold text-amber-900 transition-transform active:scale-95 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200 cursor-pointer"
                  >
                    {language === "en" ? "Reset to 0" : "Kosongkan (Rp 0)"}
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveWallet}
                    disabled={wallets.length <= 1}
                    className="inline-flex items-center justify-center gap-1 rounded-2xl border border-rose-300 bg-rose-100/80 py-2 text-xs font-bold text-rose-700 transition-transform active:scale-95 disabled:opacity-40 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{language === "en" ? "Delete" : "Hapus Dompet"}</span>
                  </button>
                </div>
                {wallets.length <= 1 && (
                  <p className="text-center text-[10px] text-slate-500">
                    {language === "en"
                      ? "At least 1 wallet must remain."
                      : "Minimal 1 dompet harus ada (gunakan Kosongkan Rp 0)."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YUK CATAT! 3-Card Frosted Glass Strip (Matching Reference) */}
      <section aria-label="Yuk Catat">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="font-display text-base font-bold text-[#241F35] dark:text-white">
            {language === "en" ? "Quick Log!" : "Yuk Catat!"}
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <Award className="h-3.5 w-3.5" />
            {savingsRate}% {language === "en" ? "saved" : "hemat"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <motion.button
            type="button"
            onClick={() => onQuickLog("income")}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            className="glass-panel flex items-center justify-center gap-2 rounded-2xl px-2.5 py-3 transition-transform cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-[#241F35] dark:text-slate-100 truncate">
              {language === "en" ? "Income" : "Pemasukan"}
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => onQuickLog("expense")}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            className="glass-panel flex items-center justify-center gap-2 rounded-2xl px-2.5 py-3 transition-transform cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-200/80 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-[#241F35] dark:text-slate-100 truncate">
              {language === "en" ? "Expense" : "Pengeluaran"}
            </span>
          </motion.button>

          <motion.button
            type="button"
            onClick={onOpenTransfer}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            className="glass-panel flex items-center justify-center gap-2 rounded-2xl px-2.5 py-3 transition-transform cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-200/80 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
              <ArrowLeftRight className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-[#241F35] dark:text-slate-100 truncate">
              Transfer
            </span>
          </motion.button>
        </div>
      </section>

      {/* KATA-KATA MUCUW HARI INI (Frosted Pastel Pill) */}
      <button
        type="button"
        onClick={() => setQuoteIdx((i) => i + 1)}
        className="flex w-full items-center justify-between gap-3 rounded-full border border-white/75 bg-gradient-to-r from-[#E9D5FF]/55 via-[#F3E8FF]/55 to-[#FCE7F3]/55 px-3.5 py-2 text-left text-[#241F35] shadow-[0_10px_24px_-12px_rgba(42,31,74,0.18),inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl transition-transform active:scale-[0.98] dark:border-purple-400/20 dark:from-[#231B33]/75 dark:to-[#291928]/75 dark:text-slate-100 cursor-pointer"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white bg-white/80">
            <CuteMochiAvatar
              src={companionAvatarUrl}
              name={activeName}
              shapeClass="rounded-full"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-purple-800/80 dark:text-purple-300">
              {language === "en" ? `Daily ${activeName} Note` : `Kata-kata ${activeName} hari ini`}
            </p>
            <p className="truncate text-xs font-bold">{activeQuote}</p>
          </div>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#241F35] dark:border-white/15 dark:bg-white/10 dark:text-white">
          <Mail className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}
