import { ChangeEvent, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Award,
  Eye,
  EyeOff,
  MessageCircleHeart,
  Palette,
  RotateCcw,
  Settings,
  Upload,
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
}

const MASCOT_IMAGES = {
  happy: "/src/assets/images/mucuw_happy_1794569740186.jpg",
  alert: "/src/assets/images/mucuw_alert_1794569740158.jpg",
  worried: "/src/assets/images/mucuw_worried_1794569740934.jpg",
};

const WIDGET_THEMES: Record<
  WidgetTheme,
  {
    label: string;
    bg: string;
    border: string;
  }
> = {
  mint: {
    label: "Mint",
    bg: "bg-gradient-to-br from-[#DDF8E8] via-[#F2FCF6] to-[#BFEAD2] dark:from-[#12261F] dark:via-[#15221D] dark:to-[#10201A]",
    border: "border-[#241F35]/15 dark:border-emerald-800/60",
  },
  butter: {
    label: "Butter",
    bg: "bg-gradient-to-br from-[#FFF4BF] via-[#FFFBEB] to-[#FFE8A3] dark:from-[#262011] dark:via-[#1C1810] dark:to-[#211B0F]",
    border: "border-[#241F35]/15 dark:border-amber-800/60",
  },
  sky: {
    label: "Sky",
    bg: "bg-gradient-to-br from-[#CFE6FF] via-[#EAF6FF] to-[#DCCBFF] dark:from-[#12202E] dark:via-[#141C24] dark:to-[#1B182C]",
    border: "border-[#241F35]/15 dark:border-sky-800/60",
  },
  lilac: {
    label: "Lilac",
    bg: "bg-gradient-to-br from-[#EBDDFB] via-[#FAF5FF] to-[#FFD6E8] dark:from-[#23192E] dark:via-[#1B1622] dark:to-[#261621]",
    border: "border-[#241F35]/15 dark:border-purple-800/60",
  },
};

const SHAPE_CLASSES: Record<WidgetShape, string> = {
  square: "rounded-3xl",
  circle: "rounded-full",
  cloud: "rounded-[58%_42%_55%_45%/48%_58%_42%_52%]",
};

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
  remainingBudget,
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
  onOpenScanner,
  onOpenTransfer,
  onOpenAiInsights,
  onOpenProfile,
}: MascotBannerProps) {
  const [imgError, setImgError] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const mood: "happy" | "alert" | "worried" =
    budgetRatio >= 0.95 ? "worried" : budgetRatio >= 0.7 ? "alert" : "happy";

  const cuanLevel =
    savingsRate >= 40
      ? { level: 5, titleId: "Sultan Anti-Bocor", titleEn: "Master Saver" }
      : savingsRate >= 25
        ? { level: 4, titleId: "Penjaga Cuan", titleEn: "Cashflow Guardian" }
        : savingsRate >= 10
          ? { level: 3, titleId: "Pejuang Hemat", titleEn: "Budget Keeper" }
          : { level: 2, titleId: "Mulai Disiplin", titleEn: "Rising Tracker" };

  const activeName = companionName.trim() || "Mucuw";
  const quotes = language === "en" ? MOCHI_QUOTES_EN : MOCHI_QUOTES_ID;
  const activeQuote = quotes[quoteIdx % quotes.length];

  const copy = {
    happy: {
      id: {
        status: "Dompet Adem",
        headline: `"Jatah aman hari ini masih ${formatCurrency(Math.max(0, dailySafeLimit), currency, privacyMode)}. Menabung pelan tapi pasti!"`,
        desc: `Sisa anggaran ${formatCurrency(Math.max(0, remainingBudget), currency, privacyMode)} · ritme keuanganmu lagi rapi.`,
      },
      en: {
        status: "Wallet Calm",
        headline: `"Today's safe limit is ${formatCurrency(Math.max(0, dailySafeLimit), currency, privacyMode)}. Steady and sweet!"`,
        desc: `Remaining budget ${formatCurrency(Math.max(0, remainingBudget), currency, privacyMode)} · pace looks solid.`,
      },
    },
    alert: {
      id: {
        status: "Mulai Waspada",
        headline: `"Jajan udah jalan ${Math.round(budgetRatio * 100)}% nih! Rem dikit biar akhir bulan tetap senyum."`,
        desc: `Jatah aman harian tinggal ${formatCurrency(Math.max(0, dailySafeLimit), currency, privacyMode)}/hari.`,
      },
      en: {
        status: "Watch Pace",
        headline: `"${Math.round(budgetRatio * 100)}% of budget used! Slow down slightly so month-end stays calm."`,
        desc: `Safe daily allowance is ${formatCurrency(Math.max(0, dailySafeLimit), currency, privacyMode)}/day.`,
      },
    },
    worried: {
      id: {
        status: "Darurat Bocor",
        headline: `"Dompet udah teriak! Anggaran tembus ${Math.round(budgetRatio * 100)}%, tahan checkout dulu ya!"`,
        desc: `Aktifkan Tantangan Hemat atau jalankan Audit AI sekarang.`,
      },
      en: {
        status: "Budget Tight",
        headline: `"Wallet alert! Budget hit ${Math.round(budgetRatio * 100)}%, pause impulse buys today!"`,
        desc: `Run AI Anti-Leak Audit or check-in on a Spending Challenge.`,
      },
    },
  }[mood][language];

  const themeStyle = WIDGET_THEMES[widgetTheme] ?? WIDGET_THEMES.sky;
  const activeAvatar = companionAvatarUrl || MASCOT_IMAGES[mood];

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImgError(false);
        onUpdateWidget({ companionAvatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Greeting Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#241F35] dark:text-white">
            Halo, {userName || "Teman"}!
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {language === "en"
              ? "Let's check your money and keep leaks away today."
              : "Yuk cek uang kamu hari ini biar tetap aman dan anti bocor."}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          className="glass-panel inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold text-[#241F35] transition-transform hover:-translate-y-0.5 active:scale-95 dark:text-slate-100 cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>{language === "en" ? "Profile & Theme" : "Profil & Tema"}</span>
        </button>
      </div>

      {/* Main 2-Column Mochi Scenic Glass Card + Customizable Shape Widget */}
      <section
        aria-label="Kartu Saldo dan Widget Mochi"
        className="grid grid-cols-1 gap-5 lg:grid-cols-12"
      >
        {/* Left: Scenic Sky & Rolling Hills Frosted Glass Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/85 bg-gradient-to-b from-[#CBE6FF]/85 via-[#EAF6FF]/80 to-[#D6F5E0]/85 p-5 sm:p-6 text-[#241F35] shadow-[0_14px_34px_-12px_rgba(42,31,74,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl dark:border-white/12 dark:from-[#162638]/80 dark:via-[#14222E]/75 dark:to-[#112620]/80 dark:text-slate-100 lg:col-span-7">
          {/* Cute Scenic Rolling Hills + Blushing Cloud SVG Background */}
          <svg
            aria-hidden="true"
            viewBox="0 0 600 280"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-95 dark:opacity-25"
          >
            {/* Cute left cloud with tiny eyes */}
            <ellipse cx="95" cy="54" rx="54" ry="18" fill="#FFFFFF" opacity="0.88" />
            <ellipse cx="132" cy="45" rx="34" ry="16" fill="#FFFFFF" opacity="0.88" />
            <circle cx="90" cy="52" r="2" fill="#64748B" opacity="0.55" />
            <circle cx="104" cy="52" r="2" fill="#64748B" opacity="0.55" />
            <ellipse cx="85" cy="56" rx="3.5" ry="1.8" fill="#FDA4AF" opacity="0.7" />
            <ellipse cx="109" cy="56" rx="3.5" ry="1.8" fill="#FDA4AF" opacity="0.7" />

            {/* Right fluffy cloud & sun */}
            <circle cx="535" cy="42" r="18" fill="#FFF3B0" opacity="0.9" />
            <ellipse cx="486" cy="64" rx="46" ry="15" fill="#FFFFFF" opacity="0.85" />

            {/* Twinkle stars */}
            <path d="M260 32 L263 39 L270 42 L263 45 L260 52 L257 45 L250 42 L257 39 Z" fill="#FFFFFF" opacity="0.85" />
            <path d="M390 24 L392 29 L397 31 L392 33 L390 38 L388 33 L383 31 L388 29 Z" fill="#FFF5B8" opacity="0.9" />

            {/* Rolling pastel hills */}
            <path
              d="M0 175 Q140 130 290 165 T600 150 V280 H0 Z"
              fill="#BDE8BD"
            />
            <path
              d="M0 218 Q180 185 350 214 T600 202 V280 H0 Z"
              fill="#97D8A3"
            />
            <circle cx="72" cy="236" r="5" fill="#FFC2DD" />
            <circle cx="235" cy="248" r="5" fill="#FFF0A0" />
            <circle cx="512" cy="240" r="5" fill="#FFFFFF" />
          </svg>

          {/* Top Wallet Selector + Privacy Toggle */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <select
              value={selectedWalletFilter}
              onChange={(e) => onSelectWalletFilter(e.target.value)}
              aria-label="Pilih Dompet Kartu Utama"
              className="rounded-full bg-[#241F35] px-3.5 py-1.5 text-xs font-semibold text-white outline-none dark:bg-slate-900 cursor-pointer"
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

            <button
              type="button"
              onClick={onTogglePrivacy}
              aria-label={privacyMode ? "Tampilkan saldo" : "Sembunyikan saldo"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#241F35] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              {privacyMode ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Centered Hero Balance */}
          <div className="relative z-10 my-6 text-center">
            <p className="text-xs font-semibold text-[#5B5478] dark:text-slate-300">
              {selectedWalletFilter === "all"
                ? language === "en"
                  ? "Total Balance"
                  : "Total Saldo"
                : wallets.find((w) => w.id === selectedWalletFilter)?.name ?? "Saldo"}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
              {formatCurrency(totalBalance, currency, privacyMode)}
            </p>
          </div>

          {/* Frosted Glass Twin Summary Panel (Pemasukan & Pengeluaran) */}
          <div className="relative z-10 rounded-2xl border border-white/85 bg-white/62 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/65">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-white/80 bg-[#E7FBF0]/80 px-3 py-2.5 text-center backdrop-blur-md dark:border-emerald-800/40 dark:bg-emerald-950/55">
                <p className="text-[11px] font-bold tracking-wide text-emerald-800 dark:text-emerald-300">
                  {language === "en" ? "INCOME" : "PEMASUKAN"}
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                  +{formatCurrency(scopedIncome, currency, privacyMode)}
                </p>
              </div>
              <div className="rounded-xl border border-white/80 bg-[#FFEDEE]/80 px-3 py-2.5 text-center backdrop-blur-md dark:border-rose-800/40 dark:bg-rose-950/55">
                <p className="text-[11px] font-bold tracking-wide text-rose-800 dark:text-rose-300">
                  {language === "en" ? "EXPENSE" : "PENGELUARAN"}
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-rose-700 dark:text-rose-300">
                  -{formatCurrency(scopedExpense, currency, privacyMode)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {language === "en" ? "Safe daily limit:" : "Jatah aman harian:"}{" "}
              <span className="font-mono tabular-nums text-[#241F35] dark:text-slate-100">
                {formatCurrency(Math.max(0, dailySafeLimit), currency, privacyMode)}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Mochi Customizable Frosted Glass Shape Widget */}
        <div
          className={`flex flex-col justify-between rounded-3xl border border-white/85 p-5 shadow-[0_14px_34px_-12px_rgba(42,31,74,0.12),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl ${themeStyle.bg} dark:border-white/12 lg:col-span-5`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span
                className={
                  mood === "happy"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : mood === "alert"
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-rose-700 dark:text-rose-400"
                }
              >
                {copy.status}
              </span>
              <span aria-hidden="true" className="text-slate-400">
                ·
              </span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#241F35] dark:text-slate-200">
                <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Lv.{cuanLevel.level}
              </span>
              <span aria-hidden="true" className="text-slate-400">
                ·
              </span>
              <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                {streakDays}d streak
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCustomizing((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl border border-[#241F35]/15 bg-white/85 px-2.5 py-1.5 text-xs font-semibold text-[#241F35] hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>{language === "en" ? "Widget" : "Kustom"}</span>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative shrink-0">
              <div
                className={`relative h-24 w-24 overflow-hidden border-2 border-white bg-white/85 shadow-md ring-1 ring-[#241F35]/10 dark:border-white/25 ${SHAPE_CLASSES[widgetShape]}`}
              >
                {!imgError ? (
                  <img
                    src={activeAvatar}
                    alt={`${activeName} Widget`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-xs font-bold text-emerald-900">
                    {activeName}
                  </div>
                )}
              </div>
              {/* Cute SVG leaf/sparkle sticker */}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute -top-2 -right-2 h-6 w-6 drop-shadow-xs"
              >
                <circle cx="12" cy="12" r="10" fill="#FFE6F2" stroke="#FFFFFF" strokeWidth="1.5" />
                <path
                  d="M12 6.5 L13.4 10.6 L17.5 12 L13.4 13.4 L12 17.5 L10.6 13.4 L6.5 12 L10.6 10.6 Z"
                  fill="#F472B6"
                />
              </svg>
            </div>

            <div className="glass-soft min-w-0 flex-1 rounded-2xl p-3.5 text-[#241F35] dark:text-slate-100">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {activeName} · {language === "en" ? cuanLevel.titleEn : cuanLevel.titleId}
              </p>
              <p className="mt-1 text-xs font-medium leading-relaxed">
                {copy.headline}
              </p>
            </div>
          </div>

          <p className="mt-3 rounded-2xl border border-white/75 bg-white/45 px-3.5 py-2 text-xs font-medium text-slate-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {copy.desc}
          </p>

          {customizing && (
            <div className="mt-4 space-y-3 border-t border-[#241F35]/10 pt-3.5 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {(["square", "circle", "cloud"] as WidgetShape[]).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => onUpdateWidget({ widgetShape: sh })}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        widgetShape === sh
                          ? "border-[#241F35] bg-[#241F35] text-white dark:border-emerald-500 dark:bg-emerald-600"
                          : "border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {sh === "square"
                        ? "Kotak"
                        : sh === "circle"
                          ? "Bulat"
                          : "Awan"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {(Object.keys(WIDGET_THEMES) as WidgetTheme[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onUpdateWidget({ widgetTheme: key })}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        widgetTheme === key
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {WIDGET_THEMES[key].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={companionName}
                  onChange={(e) => onUpdateWidget({ companionName: e.target.value })}
                  placeholder="Nama maskot (Mucuw / Mochi)"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{language === "en" ? "Photo" : "Foto Idol"}</span>
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
                    onClick={() => {
                      setImgError(false);
                      onUpdateWidget({
                        companionAvatarUrl: "",
                        companionName: "Mucuw",
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Compact 5-Icon Cute Frosted Glass Dock + Daily Mochi Quote Bar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div
          role="group"
          aria-label={language === "en" ? "Quick actions" : "Aksi cepat"}
          className="glass-panel grid grid-cols-5 gap-2 rounded-3xl p-2.5 lg:col-span-6"
        >
          {/* 1. Masuk (Income) */}
          <motion.button
            type="button"
            onClick={() => onQuickLog("income")}
            whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            title={language === "en" ? "Log Income" : "Catat Pemasukan"}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-colors hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#D8FCE7] to-[#A7F3D0] shadow-[0_6px_14px_-6px_rgba(16,185,129,0.45)] dark:border-emerald-400/30 dark:from-emerald-800/80 dark:to-emerald-900/80">
              <svg viewBox="0 0 28 28" className="h-6 w-6" aria-hidden="true">
                <circle cx="14" cy="15" r="8.5" fill="#FFFBEB" stroke="#241F35" strokeWidth="1.6" />
                <circle cx="11.5" cy="14" r="1" fill="#241F35" />
                <circle cx="16.5" cy="14" r="1" fill="#241F35" />
                <ellipse cx="9.8" cy="16" rx="1.3" ry="0.7" fill="#FF9EC6" />
                <ellipse cx="18.2" cy="16" rx="1.3" ry="0.7" fill="#FF9EC6" />
                <path d="M12.5 16.5 Q14 18 15.5 16.5" fill="none" stroke="#241F35" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M14 2.8 L14 7.5 M11.8 5.5 L14 7.8 L16.2 5.5" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[11px] font-semibold text-[#241F35] dark:text-slate-100 whitespace-nowrap">
              {language === "en" ? "Income" : "Masuk"}
            </span>
          </motion.button>

          {/* 2. Keluar (Expense) */}
          <motion.button
            type="button"
            onClick={() => onQuickLog("expense")}
            whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            title={language === "en" ? "Log Expense" : "Catat Pengeluaran"}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-colors hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#FFE0EE] to-[#FBCFE8] shadow-[0_6px_14px_-6px_rgba(244,114,182,0.45)] dark:border-rose-400/30 dark:from-rose-900/80 dark:to-pink-900/80">
              <svg viewBox="0 0 28 28" className="h-6 w-6" aria-hidden="true">
                <path d="M10.5 9.5 C10.5 6.8 17.5 6.8 17.5 9.5" fill="none" stroke="#241F35" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="6.5" y="9.5" width="15" height="13" rx="4" fill="#FFF7FA" stroke="#241F35" strokeWidth="1.6" />
                <circle cx="11.5" cy="15" r="1" fill="#241F35" />
                <circle cx="16.5" cy="15" r="1" fill="#241F35" />
                <ellipse cx="9.5" cy="17" rx="1.3" ry="0.7" fill="#FF9EC6" />
                <ellipse cx="18.5" cy="17" rx="1.3" ry="0.7" fill="#FF9EC6" />
                <path d="M12.7 17.4 Q14 18.7 15.3 17.4" fill="none" stroke="#241F35" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[11px] font-semibold text-[#241F35] dark:text-slate-100 whitespace-nowrap">
              {language === "en" ? "Expense" : "Keluar"}
            </span>
          </motion.button>

          {/* 3. Transfer */}
          <motion.button
            type="button"
            onClick={onOpenTransfer}
            whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            title={language === "en" ? "Transfer & Wallets" : "Transfer & Dompet"}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-colors hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] shadow-[0_6px_14px_-6px_rgba(59,130,246,0.4)] dark:border-sky-400/30 dark:from-sky-900/80 dark:to-blue-900/80">
              <svg viewBox="0 0 28 28" className="h-6 w-6" aria-hidden="true">
                <rect x="4.5" y="7.5" width="19" height="13" rx="4" fill="#F8FAFC" stroke="#241F35" strokeWidth="1.6" />
                <path d="M9.5 12.2 H17.5 M15.3 10 L17.8 12.2 L15.3 14.4" fill="none" stroke="#2563EB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 16.4 H10.5 M12.7 14.2 L10.2 16.4 L12.7 18.6" fill="none" stroke="#241F35" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[11px] font-semibold text-[#241F35] dark:text-slate-100 whitespace-nowrap">
              Transfer
            </span>
          </motion.button>

          {/* 4. Scan Struk */}
          <motion.button
            type="button"
            onClick={onOpenScanner}
            whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            title={language === "en" ? "AI Receipt Scanner" : "Scan Struk AI"}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-colors hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] shadow-[0_6px_14px_-6px_rgba(245,158,11,0.45)] dark:border-amber-400/30 dark:from-amber-900/80 dark:to-yellow-900/80">
              <svg viewBox="0 0 28 28" className="h-6 w-6" aria-hidden="true">
                <path d="M9.5 7.5 L11 5.5 H17 L18.5 7.5" fill="#FFFBEB" stroke="#241F35" strokeWidth="1.5" strokeLinejoin="round" />
                <rect x="4.5" y="7.5" width="19" height="14.5" rx="4.5" fill="#FFFBEB" stroke="#241F35" strokeWidth="1.6" />
                <circle cx="14" cy="14.8" r="4.3" fill="#FEF08A" stroke="#241F35" strokeWidth="1.5" />
                <path d="M12.2 14.5 Q12.8 13.7 13.4 14.5 M14.6 14.5 Q15.2 13.7 15.8 14.5" fill="none" stroke="#241F35" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="19.6" cy="11" r="1.1" fill="#F472B6" />
              </svg>
            </span>
            <span className="text-[11px] font-semibold text-[#241F35] dark:text-slate-100 whitespace-nowrap">
              Scan
            </span>
          </motion.button>

          {/* 5. Audit AI */}
          <motion.button
            type="button"
            onClick={onOpenAiInsights}
            whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            title={language === "en" ? "AI Financial Audit" : "Audit Keuangan AI"}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-colors hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] shadow-[0_6px_14px_-6px_rgba(139,92,246,0.45)] dark:border-violet-400/30 dark:from-violet-900/80 dark:to-purple-900/80">
              <svg viewBox="0 0 28 28" className="h-6 w-6" aria-hidden="true">
                <circle cx="14" cy="14.5" r="8" fill="#FAF5FF" stroke="#241F35" strokeWidth="1.6" />
                <path d="M14 8.8 L15.2 12.2 L18.6 13.4 L15.2 14.6 L14 18 L12.8 14.6 L9.4 13.4 L12.8 12.2 Z" fill="#A855F7" />
                <circle cx="21.5" cy="7" r="1.4" fill="#F472B6" />
                <circle cx="6.8" cy="20.5" r="1.1" fill="#FBBF24" />
              </svg>
            </span>
            <span className="text-[11px] font-semibold text-[#241F35] dark:text-slate-100 whitespace-nowrap">
              Audit
            </span>
          </motion.button>
        </div>

        <button
          type="button"
          onClick={() => setQuoteIdx((i) => i + 1)}
          className="flex items-center justify-between gap-3 rounded-3xl border border-white/85 bg-gradient-to-r from-[#EBDDFB]/80 to-[#FFDFF0]/80 px-5 py-3 text-left text-[#241F35] shadow-[0_10px_28px_-12px_rgba(42,31,74,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-transform hover:-translate-y-0.5 active:scale-[0.99] dark:border-purple-400/20 dark:from-[#231B33]/80 dark:to-[#291928]/80 dark:text-slate-100 lg:col-span-6 cursor-pointer"
        >
          <div className="flex min-w-0 items-center gap-3">
            <MessageCircleHeart className="h-5 w-5 shrink-0 text-purple-700 dark:text-purple-300" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide opacity-75">
                {language === "en" ? "Daily Mochi Note" : "Kata-kata Mochi hari ini"}
              </p>
              <p className="truncate text-xs font-semibold sm:text-sm">
                {activeQuote}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-semibold opacity-70 whitespace-nowrap">
            {language === "en" ? "Next" : "Ganti"}
          </span>
        </button>
      </div>
    </div>
  );
}
