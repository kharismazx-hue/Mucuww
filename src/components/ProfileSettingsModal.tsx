import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Download,
  Palette,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  AppThemeMode,
  Currency,
  CustomCategory,
  Language,
  TransactionType,
} from "../types/finance";
import { PWAInstallButton } from "./PWAInstallPrompt";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  appTheme: AppThemeMode;
  language: Language;
  currency: Currency;
  soundEnabled: boolean;
  customCategories: CustomCategory[];
  onUpdateProfile: (patch: {
    userName?: string;
    appTheme?: AppThemeMode;
    language?: Language;
    currency?: Currency;
    soundEnabled?: boolean;
  }) => void;
  onAddCustomCategory: (cat: Omit<CustomCategory, "id">) => void;
  onDeleteCustomCategory: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonText: string) => void;
  onResetAll: () => void;
}

const CAT_COLORS = ["#F472B6", "#A78BFA", "#38BDF8", "#34D399", "#FBBF24", "#FB7185"];

export function ProfileSettingsModal({
  isOpen,
  onClose,
  userName,
  appTheme,
  language,
  currency,
  soundEnabled,
  customCategories,
  onUpdateProfile,
  onAddCustomCategory,
  onDeleteCustomCategory,
  onExportBackup,
  onImportBackup,
  onResetAll,
}: ProfileSettingsModalProps) {
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<TransactionType>("expense");
  const [catColor, setCatColor] = useState(CAT_COLORS[0]);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddCat = (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onAddCustomCategory({
      name: catName.trim(),
      type: catType,
      color: catColor,
    });
    setCatName("");
  };

  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        try {
          onImportBackup(reader.result);
          setImportStatus(
            language === "en"
              ? "Backup restored successfully."
              : "Data cadangan berhasil dipulihkan."
          );
        } catch {
          setImportStatus(
            language === "en" ? "Invalid JSON file." : "Format file JSON tidak valid."
          );
        }
      }
    };
    reader.readAsText(file);
  };

  const themeOptions: Array<{ id: AppThemeMode; label: string }> = [
    { id: "pastel", label: "Pastel Mochi" },
    { id: "plain", label: "Terang" },
    { id: "bold", label: "Bold Ink" },
    { id: "dark", label: "Gelap" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prof-modal-title"
      onClick={onClose}
    >
      <div
        className="glass-modal max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3
            id="prof-modal-title"
            className="font-display text-lg font-semibold text-[#241F35] dark:text-slate-100"
          >
            {language === "en" ? "Profile & Preferences" : "Profil & Pengaturan Mochi"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* User Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {language === "en" ? "Your Display Name" : "Nama Panggilan"}
            </label>
            <input
              type="text"
              maxLength={24}
              value={userName}
              onChange={(e) => onUpdateProfile({ userName: e.target.value })}
              placeholder="Teman"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* 4 Themes */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Palette className="h-3.5 w-3.5" />
              <span>{language === "en" ? "Appearance & Theme" : "Tampilan & Tema"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateProfile({ appTheme: opt.id })}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    appTheme === opt.id
                      ? "border-[#241F35] bg-[#241F35] text-white dark:border-emerald-500 dark:bg-emerald-600"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles: Language, Currency, Sound Effect */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === "en" ? "Language" : "Bahasa"}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {(["id", "en"] as Language[]).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => onUpdateProfile({ language: lng })}
                    className={`rounded-md py-1 text-xs font-semibold cursor-pointer ${
                      language === lng
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {lng.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {language === "en" ? "Currency" : "Mata Uang"}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                {(["IDR", "USD"] as Currency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => onUpdateProfile({ currency: cur })}
                    className={`rounded-md py-1 font-mono text-xs font-semibold cursor-pointer ${
                      currency === cur
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Sound Effect
              </p>
              <button
                type="button"
                onClick={() => onUpdateProfile({ soundEnabled: !soundEnabled })}
                className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold cursor-pointer ${
                  soundEnabled
                    ? "bg-[#DDF8E8] text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>OFF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <PWAInstallButton language={language} variant="card" />

          {/* Custom Categories */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === "en" ? "Custom Categories" : "Kelola Kategori Kustom"}
            </p>

            <form onSubmit={handleAddCat} className="mt-2.5 flex flex-wrap gap-2">
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder={
                  language === "en" ? "e.g. Pets, Skincare" : "Mis. Anabul, Skincare"
                }
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <select
                value={catType}
                onChange={(e) => setCatType(e.target.value as TransactionType)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
              <div className="flex items-center gap-1">
                {CAT_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setCatColor(col)}
                    aria-label={`Pilih warna ${col}`}
                    className={`h-6 w-6 rounded-full border-2 cursor-pointer ${
                      catColor === col ? "border-[#241F35] scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            {customCategories.length > 0 && (
              <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200/80 dark:divide-slate-800 dark:border-slate-800">
                {customCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3.5 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {c.name}
                      </span>
                      <span className="text-slate-400">
                        · {c.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteCustomCategory(c.id)}
                      aria-label={`Hapus ${c.name}`}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup & Reset */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="mb-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === "en" ? "Backup & Data Control" : "Cadangkan & Pulihkan Data"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <Upload className="h-3.5 w-3.5" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleFileImport}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={onResetAll}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[#FFE4EF] px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{language === "en" ? "Reset Sample" : "Reset Data Contoh"}</span>
              </button>
            </div>
            {importStatus && (
              <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {importStatus}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
