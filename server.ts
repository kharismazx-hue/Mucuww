import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "15mb" }));

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const VALID_CATEGORIES = [
  "makan",
  "kopi",
  "transport",
  "belanja",
  "tagihan",
  "hiburan",
  "kesehatan",
  "pendidikan",
  "gaji",
  "freelance",
  "lainnya",
];

app.post("/api/scan-receipt", async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY belum terkonfigurasi di environment server.",
      });
    }

    const { imageBase64, mimeType, textNote, language = "id" } = req.body ?? {};

    if (!imageBase64 && !textNote) {
      return res.status(400).json({
        error: "Kirimkan gambar struk/QRIS atau catatan transaksi untuk dipindai.",
      });
    }

    const langInstruction =
      language === "en"
        ? "Respond in natural friendly English."
        : "Respond in natural, relatable Bahasa Indonesia (Gen-Z friendly, concise, no slang cringe).";

    const systemInstruction = `You are Mucuw, a friendly, sharp capybara personal finance assistant.
Extract transaction details accurately from receipts, QRIS screenshots, bank transfer proofs, or short text notes.
Valid category IDs: ${VALID_CATEGORIES.join(", ")}.
Map Indonesian receipts intelligently:
- Warteg, resto, makanan, Indomaret snacks, GoFood/GrabFood -> "makan"
- Kopi Kenangan, Fore, Starbucks, boba, matcha, jajan -> "kopi"
- GoRide, GrabCar, bensin, parkir, tol, KRL, MRT -> "transport"
- Alfamart/Indomaret groceries, Shopee, Tokopedia, skincare, baju -> "belanja"
- PLN, PDAM, WiFi, pulsa, kuota, kos, cicilan -> "tagihan"
- Bioskop, Spotify, Netflix, game, konser -> "hiburan"
- Apotek, dokter, vitamin -> "kesehatan"
- Kursus, buku -> "pendidikan"
- Gaji, bonus -> "gaji"
- Proyek, komisi -> "freelance"
Amount must be a clean integer in IDR (e.g., 28500). If date is missing, use ${new Date().toISOString().slice(0, 10)}.
${langInstruction}`;

    const parts: Array<
      | { inlineData: { mimeType: string; data: string } }
      | { text: string }
    > = [];

    if (imageBase64) {
      const cleanedBase64 = String(imageBase64).includes(",")
        ? String(imageBase64).split(",")[1]
        : String(imageBase64);
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanedBase64,
        },
      });
      parts.push({
        text: "Ekstrak informasi transaksi dari struk belanja, tagihan, atau bukti transfer/QRIS ini.",
      });
    } else {
      parts.push({
        text: `Ekstrak informasi transaksi dari catatan singkat berikut: "${String(textNote)}"`,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: {
              type: Type.STRING,
              description: "Nama toko, merchant, atau judul transaksi singkat.",
            },
            amount: {
              type: Type.INTEGER,
              description: "Total nominal transaksi dalam Rupiah (angka bulat).",
            },
            type: {
              type: Type.STRING,
              description: "Jenis transaksi: 'expense' atau 'income'.",
            },
            category: {
              type: Type.STRING,
              description: `Salah satu kategori valid: ${VALID_CATEGORIES.join(", ")}`,
            },
            date: {
              type: Type.STRING,
              description: "Tanggal transaksi format YYYY-MM-DD.",
            },
            notes: {
              type: Type.STRING,
              description: "Ringkasan item atau detail singkat transaksi.",
            },
            suggestedWallet: {
              type: Type.STRING,
              description: "Dugaan dompet jika terlihat (misal: GoPay, BCA, Tunai, ShopeePay) atau kosong.",
            },
            mucuwComment: {
              type: Type.STRING,
              description: "Komentar singkat lucu dan suportif dari maskot capybara Mucuw tentang transaksi ini (maks 18 kata).",
            },
            confidence: {
              type: Type.INTEGER,
              description: "Tingkat keyakinan pembacaan 0-100.",
            },
          },
          required: ["merchant", "amount", "type", "category", "date", "notes", "mucuwComment", "confidence"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    const safeCategory = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "lainnya";
    const safeType = parsed.type === "income" ? "income" : "expense";

    return res.json({
      merchant: parsed.merchant || "Transaksi Baru",
      amount: Math.max(0, Math.round(Number(parsed.amount) || 0)),
      type: safeType,
      category: safeCategory,
      date: parsed.date || new Date().toISOString().slice(0, 10),
      notes: parsed.notes || "",
      suggestedWallet: parsed.suggestedWallet || "",
      mucuwComment: parsed.mucuwComment || "Sudah Mucuw catat rapi biar tidak bocor!",
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 85)),
    });
  } catch (err: unknown) {
    console.error("Error in /api/scan-receipt:", err);
    const message = err instanceof Error ? err.message : "Gagal memproses pemindaian struk.";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/ai-insights", async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY belum terkonfigurasi di environment server.",
      });
    }

    const { summary, language = "id" } = req.body ?? {};
    if (!summary) {
      return res.status(400).json({ error: "Ringkasan keuangan diperlukan." });
    }

    const langInstruction =
      language === "en"
        ? "Respond in crisp, helpful English."
        : "Respond in crisp, friendly Bahasa Indonesia.";

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Analisis data keuangan pribadi berikut dan berikan diagnosis anti-bocor:\n${JSON.stringify(summary)}`,
      config: {
        systemInstruction: `You are Mucuw, a smart capybara financial coach helping users stop financial leaks ("keuangan anti bocor").
Analyze the provided monthly income, expenses, category breakdown, budget limits, and dream goals.
Give specific, data-backed advice referencing their real categories and IDR numbers. ${langInstruction}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: "1 kalimat diagnosis kondisi keuangan bulan ini.",
            },
            mucuwMood: {
              type: Type.STRING,
              description: "Salah satu: 'happy', 'alert', atau 'worried'.",
            },
            mucuwSpeech: {
              type: Type.STRING,
              description: "Pesan hangat dan jenaka dari Mucuw si Capybara (2 kalimat).",
            },
            leakAlert: {
              type: Type.STRING,
              description: "Potensi kebocoran uang paling nyata berdasarkan kategori terbesar atau melebihi budget.",
            },
            actionableTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  estimatedMonthlySaving: { type: Type.INTEGER },
                },
                required: ["title", "detail", "estimatedMonthlySaving"],
              },
            },
          },
          required: ["headline", "mucuwMood", "mucuwSpeech", "leakAlert", "actionableTips"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    return res.json(parsed);
  } catch (err: unknown) {
    console.error("Error in /api/ai-insights:", err);
    const message = err instanceof Error ? err.message : "Gagal menganalisis laporan keuangan.";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/spending-tip", async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY belum terkonfigurasi di environment server.",
      });
    }

    const { analysisInput, language = "id" } = req.body ?? {};
    if (!analysisInput) {
      return res.status(400).json({ error: "Data ringkasan transaksi diperlukan." });
    }

    const langInstruction =
      language === "en"
        ? "Respond in crisp, friendly English."
        : "Respond in crisp, friendly Bahasa Indonesia (natural, casual, easy to understand).";

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Analyze this monthly expense breakdown and merchant recurrence data to produce a single high-impact Spending Trend tip:\n${JSON.stringify(analysisInput)}`,
      config: {
        systemInstruction: `You are Mucuw, a cute and sharp personal finance companion.
Look closely at recurring/frequent merchants, average spending per visit, and month-over-month spending differences.
Identify ONE clear spending trend pattern — especially a recurring merchant (2+ visits) or rising category that is causing higher-than-average expenses this month, OR praise a healthy drop if overall spending decreased.
Always cite real merchant names and actual numbers from the data. ${langInstruction}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: "Short 4-8 word headline summarizing the spending trend.",
            },
            tip: {
              type: Type.STRING,
              description: "1-2 concise sentences identifying the recurring merchant or category driver and a practical suggestion.",
            },
            focusMerchant: {
              type: Type.STRING,
              description: "Exact name of the recurring merchant or top category causing the trend, or empty string if none.",
            },
            impactType: {
              type: Type.STRING,
              description: "One of: 'warning', 'positive', or 'neutral'.",
            },
            estimatedMonthlySaving: {
              type: Type.INTEGER,
              description: "Estimated monthly IDR saving if user follows the tip (integer >= 0).",
            },
          },
          required: ["headline", "tip", "focusMerchant", "impactType", "estimatedMonthlySaving"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    return res.json({
      headline: parsed.headline || "Pola Belanja Bulan Ini",
      tip: parsed.tip || "",
      focusMerchant: parsed.focusMerchant || "",
      impactType:
        parsed.impactType === "positive" || parsed.impactType === "warning"
          ? parsed.impactType
          : "neutral",
      estimatedMonthlySaving: Math.max(
        0,
        Math.round(Number(parsed.estimatedMonthlySaving) || 0)
      ),
    });
  } catch (err: unknown) {
    console.error("Error in /api/spending-tip:", err);
    const message =
      err instanceof Error ? err.message : "Gagal menganalisis tren pengeluaran.";
    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Mucuw server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
