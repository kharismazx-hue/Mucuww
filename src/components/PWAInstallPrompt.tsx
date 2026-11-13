import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  Share,
  Smartphone,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import { Language } from "../types/finance";
import { useOnlineStatus, usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  language: Language;
  variant?: "header" | "card";
}

export function PWAInstallButton({
  language,
  variant = "header",
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } =
    usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!showGuide) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowGuide(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showGuide]);

  if (isInstalled) {
    return null;
  }

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      {variant === "header" ? (
        <button
          type="button"
          onClick={handlePrimaryClick}
          title={
            language === "en"
              ? "Install Mucuw as a mobile app & home widget"
              : "Pasang Mucuw jadi aplikasi & widget HP"
          }
          aria-label={
            language === "en"
              ? "Install App & Home Screen Guide"
              : "Pasang Aplikasi & Widget HP"
          }
          className="glass-soft inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#241F35] transition-transform hover:scale-105 active:scale-95 dark:text-slate-100 whitespace-nowrap cursor-pointer"
        >
          <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">
            {isInstallable
              ? language === "en"
                ? "Install App"
                : "Pasang App"
              : language === "en"
                ? "Add to Phone"
                : "Widget & App"}
          </span>
        </button>
      ) : (
        <div className="glass-soft rounded-2xl border border-emerald-200/70 p-4 dark:border-emerald-800/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="font-display text-sm font-semibold text-[#241F35] dark:text-slate-100">
                  {language === "en"
                    ? "Install as Mobile App & Home Widget"
                    : "Pasang ke HP (Tanpa PlayStore)"}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {language === "en"
                  ? "Works offline, opens full-screen, and pins Mucuw shortcuts straight to your home screen."
                  : "Bisa dibuka layar penuh, tetap jalan saat offline, dan tambah shortcut widget Mucuw di layar utama HP."}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#241F35] px-3.5 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 dark:bg-emerald-600 whitespace-nowrap cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>
                {isInstallable
                  ? language === "en"
                    ? "Install Now"
                    : "Instal Sekarang"
                  : language === "en"
                    ? "How to Add"
                    : "Cara Pasang"}
              </span>
            </button>
          </div>
        </div>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/60 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Mucuw App Icon"
                  className="h-11 w-11 rounded-2xl shadow-sm"
                />
                <div>
                  <h3
                    id="pwa-guide-title"
                    className="font-display text-base font-bold text-[#241F35] dark:text-white"
                  >
                    {language === "en"
                      ? "Install Mucuw on Your Phone"
                      : "Jadikan Mucuw Aplikasi & Widget HP"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === "en"
                      ? "No Play Store or App Store needed"
                      : "Langsung dari browser tanpa PlayStore"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup"
                className="rounded-xl p-1.5 text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {isInstallable && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-800/50 dark:bg-emerald-950/40">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                    {language === "en"
                      ? "One-tap install is ready!"
                      : "Instalasi 1-klik siap dipakai!"}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await install();
                      if (ok) setShowGuide(false);
                    }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      {language === "en"
                        ? "Install Mucuw App"
                        : "Instal Aplikasi Mucuw"}
                    </span>
                  </button>
                </div>
              )}

              <div
                className={`rounded-2xl border p-3.5 ${
                  isAndroid
                    ? "border-emerald-300 bg-white/75 dark:border-emerald-700/60 dark:bg-white/5"
                    : "border-white/70 bg-white/55 dark:border-white/10 dark:bg-white/5"
                }`}
              >
                <p className="font-display font-semibold text-[#241F35] dark:text-white">
                  {language === "en"
                    ? "Android (Chrome / Edge)"
                    : "Android (Chrome / Edge)"}
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                  <li>
                    {language === "en"
                      ? "Tap the three-dot menu (⋮) in the top right of Chrome."
                      : "Ketuk ikon titik tiga (⋮) di pojok kanan atas Chrome."}
                  </li>
                  <li>
                    {language === "en"
                      ? 'Choose "Add to Home screen" or "Install app".'
                      : 'Pilih "Tambahkan ke Layar Utama" atau "Instal aplikasi".'}
                  </li>
                  <li>
                    {language === "en"
                      ? "Press & hold the Mucuw icon on your home screen anytime for quick shortcuts (Log Expense / Scan Receipt)."
                      : "Tekan & tahan ikon Mucuw di layar HP untuk shortcut cepat (Catat Keluar / Scan Struk)."}
                  </li>
                </ol>
              </div>

              <div
                className={`rounded-2xl border p-3.5 ${
                  isIOS
                    ? "border-emerald-300 bg-white/75 dark:border-emerald-700/60 dark:bg-white/5"
                    : "border-white/70 bg-white/55 dark:border-white/10 dark:bg-white/5"
                }`}
              >
                <p className="flex items-center gap-1.5 font-display font-semibold text-[#241F35] dark:text-white">
                  <Share className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span>iPhone / iPad (Safari)</span>
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                  <li>
                    {language === "en"
                      ? "Tap the Share button in Safari's toolbar."
                      : "Ketuk tombol Bagikan (ikon panah ke atas) di Safari."}
                  </li>
                  <li>
                    {language === "en"
                      ? 'Scroll down and tap "Add to Home Screen".'
                      : 'Gulir ke bawah lalu pilih "Tambah ke Layar Utama" (Add to Home Screen).'}
                  </li>
                </ol>
              </div>

              <div className="flex items-start gap-2 rounded-2xl bg-[#F3ECFF]/80 p-3 text-[11px] text-[#241F35] dark:bg-white/5 dark:text-slate-300">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-300" />
                <p>
                  {language === "en"
                    ? "Tip: You can customize the Mochi widget theme & shape on the Overview banner, and once installed it runs offline with cached data."
                    : "Tips: Atur tema & bentuk widget Mochi di beranda, dan setelah dipasang di layar utama HP, Mucuw bisa dipakai offline!"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#241F35] py-2.5 text-xs font-semibold text-white transition-transform active:scale-95 dark:bg-emerald-600 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{language === "en" ? "Got it" : "Siap, Mengerti"}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator({ language }: { language: Language }) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-2xl border border-amber-300/80 bg-amber-50/95 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-lg backdrop-blur-md dark:border-amber-700/60 dark:bg-amber-950/90 dark:text-amber-200 lg:bottom-5"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>
        {language === "en"
          ? "Offline mode — local ledger & cached data active"
          : "Mode Offline — catatan lokal & cache tetap aktif"}
      </span>
    </div>
  );
}
