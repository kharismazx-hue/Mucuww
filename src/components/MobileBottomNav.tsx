import { useEffect, useState } from "react";
import { Language, TabId } from "../types/finance";

interface MobileBottomNavProps {
  activeTab: TabId;
  language: Language;
  onSelectTab: (tab: TabId) => void;
}

type KawaiiIconName =
  | "overview"
  | "transactions"
  | "scanner"
  | "budgets"
  | "more"
  | "calendar"
  | "dreams"
  | "wallets";

function KawaiiNavIcon({
  name,
  active,
}: {
  name: KawaiiIconName;
  active: boolean;
}) {
  const wrapperGlow = active ? "scale-105 shadow-sm" : "opacity-90";

  switch (name) {
    case "overview":
      // Cute pastel Mochi house with smiling face
      return (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#D8FCE7] to-[#A7F3D0] transition-transform dark:border-emerald-400/30 dark:from-emerald-800/80 dark:to-emerald-900/80 ${wrapperGlow}`}
        >
          <svg viewBox="0 0 28 28" className="h-5 w-5" aria-hidden="true">
            <path
              d="M5 13 L14 5.5 L23 13"
              fill="none"
              stroke="#241F35"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="7.5"
              y="11.5"
              width="13"
              height="10.5"
              rx="3.5"
              fill="#FFFDF9"
              stroke="#241F35"
              strokeWidth="1.6"
            />
            <circle cx="11.8" cy="16" r="1" fill="#241F35" />
            <circle cx="16.2" cy="16" r="1" fill="#241F35" />
            <ellipse cx="10.2" cy="17.8" rx="1.2" ry="0.65" fill="#FF9EC6" />
            <ellipse cx="17.8" cy="17.8" rx="1.2" ry="0.65" fill="#FF9EC6" />
            <path
              d="M12.7 18.2 Q14 19.5 15.3 18.2"
              fill="none"
              stroke="#241F35"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      );

    case "transactions":
      // Cute smiling pastel notebook / receipt
      return (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] transition-transform dark:border-sky-400/30 dark:from-sky-800/80 dark:to-blue-900/80 ${wrapperGlow}`}
        >
          <svg viewBox="0 0 28 28" className="h-5 w-5" aria-hidden="true">
            <path
              d="M7.5 6.5 C7.5 5.4 8.4 4.5 9.5 4.5 H18.5 C19.6 4.5 20.5 5.4 20.5 6.5 V22 L18 20.3 L15.5 22 L14 20.3 L12.5 22 L10 20.3 L7.5 22 Z"
              fill="#FFFFFF"
              stroke="#241F35"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M10.5 9.2 H17.5"
              stroke="#60A5FA"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="11.7" cy="13.5" r="1" fill="#241F35" />
            <circle cx="16.3" cy="13.5" r="1" fill="#241F35" />
            <ellipse cx="10.3" cy="15.2" rx="1.1" ry="0.6" fill="#FF9EC6" />
            <ellipse cx="17.7" cy="15.2" rx="1.1" ry="0.6" fill="#FF9EC6" />
            <path
              d="M12.7 15.7 Q14 17 15.3 15.7"
              fill="none"
              stroke="#241F35"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      );

    case "scanner":
      // Cute pastel kawaii camera with sparkle
      return (
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-2xl border border-white/95 bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A] to-[#FBCFE8] shadow-[0_6px_14px_-6px_rgba(245,158,11,0.5)] transition-transform dark:border-amber-400/35 dark:from-amber-800/85 dark:to-pink-900/85 ${wrapperGlow}`}
        >
          <svg viewBox="0 0 28 28" className="h-5.5 w-5.5" aria-hidden="true">
            <path
              d="M9.5 8 L11 5.8 H17 L18.5 8"
              fill="#FFFBEB"
              stroke="#241F35"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <rect
              x="4.8"
              y="8"
              width="18.4"
              height="13.8"
              rx="4.5"
              fill="#FFFDF5"
              stroke="#241F35"
              strokeWidth="1.6"
            />
            <circle
              cx="14"
              cy="14.9"
              r="4.2"
              fill="#FEF08A"
              stroke="#241F35"
              strokeWidth="1.4"
            />
            <path
              d="M12.3 14.5 Q12.9 13.7 13.5 14.5 M14.5 14.5 Q15.1 13.7 15.7 14.5"
              fill="none"
              stroke="#241F35"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M13 16.4 Q14 17.3 15 16.4"
              fill="none"
              stroke="#241F35"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="19.6" cy="11.2" r="1.1" fill="#F472B6" />
          </svg>
        </span>
      );

    case "budgets":
      // Cute pastel piggy bank with tiny ears & smile
      return (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#FFE0EE] to-[#FBCFE8] transition-transform dark:border-pink-400/30 dark:from-pink-900/80 dark:to-rose-900/80 ${wrapperGlow}`}
        >
          <svg viewBox="0 0 28 28" className="h-5 w-5" aria-hidden="true">
            <circle cx="9.2" cy="8.5" r="2.4" fill="#F9A8D4" stroke="#241F35" strokeWidth="1.4" />
            <circle cx="18.8" cy="8.5" r="2.4" fill="#F9A8D4" stroke="#241F35" strokeWidth="1.4" />
            <rect
              x="6"
              y="8.5"
              width="16"
              height="13.5"
              rx="6.8"
              fill="#FFF5F9"
              stroke="#241F35"
              strokeWidth="1.6"
            />
            <path d="M12.2 10.6 H15.8" stroke="#F472B6" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="11.2" cy="14.2" r="1" fill="#241F35" />
            <circle cx="16.8" cy="14.2" r="1" fill="#241F35" />
            <ellipse cx="14" cy="16.6" rx="2.7" ry="1.8" fill="#FBCFE8" stroke="#241F35" strokeWidth="1.1" />
            <circle cx="13.1" cy="16.6" r="0.55" fill="#241F35" />
            <circle cx="14.9" cy="16.6" r="0.55" fill="#241F35" />
          </svg>
        </span>
      );

    case "more":
      // Cute pastel Mochi clover / bento sparkle box
      return (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] transition-transform dark:border-purple-400/30 dark:from-purple-900/80 dark:to-violet-900/80 ${wrapperGlow}`}
        >
          <svg viewBox="0 0 28 28" className="h-5 w-5" aria-hidden="true">
            <rect x="5.5" y="5.5" width="7.2" height="7.2" rx="2.4" fill="#FFFDF9" stroke="#241F35" strokeWidth="1.5" />
            <rect x="15.3" y="5.5" width="7.2" height="7.2" rx="2.4" fill="#FFE4F2" stroke="#241F35" strokeWidth="1.5" />
            <rect x="5.5" y="15.3" width="7.2" height="7.2" rx="2.4" fill="#E0F2FE" stroke="#241F35" strokeWidth="1.5" />
            <path
              d="M18.9 14.8 L19.8 17.6 L22.6 18.5 L19.8 19.4 L18.9 22.2 L18 19.4 L15.2 18.5 L18 17.6 Z"
              fill="#A855F7"
              stroke="#241F35"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );

    case "calendar":
      // Cute pastel smiling calendar
      return (
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#FFE4F2] to-[#E9D5FF] dark:border-purple-400/30 dark:from-purple-900/80 dark:to-pink-900/80">
          <svg viewBox="0 0 28 28" className="h-5 w-5" aria-hidden="true">
            <rect x="5" y="7" width="18" height="16" rx="4" fill="#FFFFFF" stroke="#241F35" strokeWidth="1.6" />
            <path d="M5 11.5 H23" stroke="#241F35" strokeWidth="1.5" />
            <path d="M9.5 5 V8.5 M18.5 5 V8.5" stroke="#241F35" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="11.3" cy="16" r="1" fill="#241F35" />
            <circle cx="16.7" cy="16" r="1" fill="#241F35" />
            <ellipse cx="9.8" cy="17.7" rx="1.1" ry="0.6" fill="#FF9EC6" />
            <ellipse cx="18.2" cy="17.7" rx="1.1" ry="0.6" fill="#FF9EC6" />
            <path d="M12.6 18 Q14 19.3 15.4 18" fill="none" stroke="#241F35" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>
      );

    case "dreams":
      // Cute pastel smiling star goal
      return (
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#FEF9C3] to-[#FDE68A] dark:border-amber-400/30 dark:from-amber-900/80 dark:to-yellow-900/80">
          <svg viewBox="0 0 28 28" className="h-5 w-5" aria-hidden="true">
            <path
              d="M14 4.5 L16.8 10.2 L23 11.1 L18.5 15.5 L19.6 21.7 L14 18.8 L8.4 21.7 L9.5 15.5 L5 11.1 L11.2 10.2 Z"
              fill="#FFFBEB"
              stroke="#241F35"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="12.2" cy="13.8" r="0.9" fill="#241F35" />
            <circle cx="15.8" cy="13.8" r="0.9" fill="#241F35" />
            <path d="M12.8 15.6 Q14 16.6 15.2 15.6" fill="none" stroke="#241F35" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
      );

    case "wallets":
      // Cute pastel smiling wallet
      return (
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/90 bg-gradient-to-br from-[#CFFAFE] to-[#A7F3D0] dark:border-teal-400/30 dark:from-teal-900/80 dark:to-emerald-900/80">
          <svg viewBox="0 0 28 28" className="h-5 w-5" aria-hidden="true">
            <rect x="4.8" y="7.5" width="18.4" height="14" rx="4.2" fill="#FFFFFF" stroke="#241F35" strokeWidth="1.6" />
            <rect x="16.8" y="12.2" width="6.4" height="4.6" rx="2" fill="#D1FAE5" stroke="#241F35" strokeWidth="1.4" />
            <circle cx="19.4" cy="14.5" r="0.9" fill="#241F35" />
            <circle cx="9.8" cy="13.5" r="1" fill="#241F35" />
            <circle cx="13.6" cy="13.5" r="1" fill="#241F35" />
            <ellipse cx="8.7" cy="15.2" rx="1.1" ry="0.6" fill="#FF9EC6" />
            <path d="M10.7 15.5 Q11.7 16.6 12.7 15.5" fill="none" stroke="#241F35" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>
      );
  }
}

export function MobileBottomNav({
  activeTab,
  language,
  onSelectTab,
}: MobileBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const secondaryTabs: Array<{
    id: TabId;
    label: string;
    desc: string;
    icon: KawaiiIconName;
  }> = [
    {
      id: "calendar",
      label: language === "en" ? "Calendar" : "Kalender",
      desc: language === "en" ? "Daily activity" : "Jadwal harian",
      icon: "calendar",
    },
    {
      id: "dreams",
      label: language === "en" ? "Dreams" : "Impian",
      desc: language === "en" ? "Goals & jars" : "Tabungan target",
      icon: "dreams",
    },
    {
      id: "wallets",
      label: language === "en" ? "Wallets" : "Dompet",
      desc: language === "en" ? "Accounts & AI" : "Saldo & Audit",
      icon: "wallets",
    },
  ];

  const isSecondaryActive =
    activeTab === "calendar" ||
    activeTab === "dreams" ||
    activeTab === "wallets";

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const primaryTabs: Array<{
    id: TabId;
    label: string;
    icon: KawaiiIconName;
  }> = [
    {
      id: "overview",
      label: language === "en" ? "Home" : "Ringkas",
      icon: "overview",
    },
    {
      id: "transactions",
      label: language === "en" ? "Ledger" : "Catatan",
      icon: "transactions",
    },
    {
      id: "scanner",
      label: language === "en" ? "Scan" : "Scan AI",
      icon: "scanner",
    },
    {
      id: "budgets",
      label: language === "en" ? "Budget" : "Budget",
      icon: "budgets",
    },
  ];

  return (
    <>
      {/* Backdrop & Frosted Drawer for the 3 extra tabs when 'Lainnya' is tapped */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {moreOpen && (
        <div
          role="dialog"
          aria-label={language === "en" ? "More features" : "Menu lainnya"}
          className="glass-modal fixed right-3 bottom-20 z-50 w-[min(92vw,340px)] rounded-3xl p-3 shadow-2xl lg:hidden"
        >
          <p className="px-2 pb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {language === "en" ? "More Mucuw Features" : "Fitur Lainnya"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {secondaryTabs.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    setMoreOpen(false);
                  }}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center transition-transform active:scale-95 cursor-pointer ${
                    active
                      ? "bg-white/90 text-[#241F35] ring-1 ring-[#241F35]/15 shadow-xs dark:bg-emerald-500/20 dark:text-emerald-200"
                      : "hover:bg-white/60 text-slate-700 dark:text-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  <KawaiiNavIcon name={item.icon} active={active} />
                  <span className="text-[11px] font-semibold leading-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact 5-Column Kawaii Mobile Bottom Dock */}
      <nav
        aria-label="Navigasi Mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-white/75 bg-white/82 px-1.5 py-1.5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0F1619]/88 lg:hidden"
      >
        {primaryTabs.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onSelectTab(item.id);
              }}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl py-1 transition-transform active:scale-95 whitespace-nowrap cursor-pointer ${
                active
                  ? "text-[#241F35] font-bold dark:text-emerald-300"
                  : "text-slate-600 font-semibold dark:text-slate-400"
              }`}
            >
              <KawaiiNavIcon name={item.icon} active={active} />
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl py-1 transition-transform active:scale-95 whitespace-nowrap cursor-pointer ${
            moreOpen || isSecondaryActive
              ? "text-[#241F35] font-bold dark:text-emerald-300"
              : "text-slate-600 font-semibold dark:text-slate-400"
          }`}
        >
          <KawaiiNavIcon name="more" active={moreOpen || isSecondaryActive} />
          <span className="text-[10px] leading-none">
            {isSecondaryActive
              ? secondaryTabs.find((s) => s.id === activeTab)?.label
              : language === "en"
                ? "More"
                : "Lainnya"}
          </span>
        </button>
      </nav>
    </>
  );
}
