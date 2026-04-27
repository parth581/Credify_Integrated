import axios from "axios";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";

import { getSectorScore } from "../SectorAnalysis/sectorScore.js";

dotenv.config();

// =====================================
// Setup
// =====================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini Init
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

// =====================================
// 1. Competitor API
// =====================================

async function getCompetitorData(lat, lon, category, radius = 1000) {
  const url = "http://localhost:5000/api/places";

  const payload = {
    lat: Number(lat),
    lon: Number(lon),
    radius: Number(radius),
    category,
  };

  const res = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
  });

  console.log("Competitor API Result:", res.data);

  return res.data;
}

// =====================================
// 2. Personal Transaction Runner
// =====================================

function runPersonalTransaction({ pdfPath, pdfDir }) {
  return new Promise((resolve, reject) => {
    const pythonDir = path.join(__dirname, "../PersonalTransaction");

    const script = path.join(pythonDir, "main.py");

    const pythonExe = path.join(pythonDir, "venv", "Scripts", "python.exe");

    const args = [];
    if (pdfPath) {
      args.push("--pdf", pdfPath);
    } else if (pdfDir) {
      args.push("--pdf-dir", pdfDir);
    } else {
      return reject(new Error("PersonalTransaction requires pdfPath or pdfDir"));
    }

    exec(
      `"${pythonExe}" "${script}" ${args.map((a) => `"${a}"`).join(" ")}`,
      { cwd: pythonDir },
      (err, stdout, stderr) => {
        if (err) return reject(stderr);

        resolve(stdout.trim());
      },
    );
  });
}

// =====================================
// 3. Sector
// =====================================

async function getSectorData(sector) {
  return await getSectorScore(sector); // score out of 30
}

// =====================================
// 4. AI SCORING
// =====================================

async function calculateAIScore(competitor, personal) {
  const prompt = `
You are a financial risk and business viability analyst.

Evaluate ONLY the following two parts:

1. Competitor Analysis (Max 35)
   Consider:
   - Number of competitors
   - Market saturation
   - Radius coverage
   - Demand vs supply

2. Personal Financial Analysis (Max 35)
   Consider:
   - Income stability
   - Risk category
   - Credit discipline
   - Spending pattern
   - Debt behavior

DO NOT score sector.

IMPORTANT RESPONSE RULES:
- NO long explanations
- Use short bullet insights (2–3 words)
- Provide 3–5 insights
- Provide 2–3 improvement suggestions
- Return STRICT JSON only

---

INPUT DATA

Competitor Data:
${JSON.stringify(competitor, null, 2)}

Personal Transaction:
${JSON.stringify(personal, null, 2)}

---

OUTPUT FORMAT:

{
  "competitorScore": number,
  "competitorInsights": [],
  "competitorSuggestions": [],
  "personalScore": number,
  "personalInsights": [],
  "personalSuggestions": []
}
`;

  const result = await model.generateContent(prompt);

  const text = result.response.text();

  // Clean Gemini response
  const cleaned = text.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}

// =====================================
// 5. Orchestrator
// =====================================

async function orchestrate(lat, lon, category, sectorName, { pdfPath, pdfDir }) {
  try {
    console.log("\n🚀 Running Credify AI Orchestrator...\n");

    // 1️⃣ Competitor
    const competitor = await getCompetitorData(lat, lon, category);
    console.log("✅ Competitor Loaded");

    // 2️⃣ Personal
    const personalRaw = await runPersonalTransaction({ pdfPath, pdfDir });

    let personal;

    try {
      personal = JSON.parse(personalRaw);
    } catch {
      personal = { raw: personalRaw };
    }

    console.log("✅ Personal Loaded");

    // 3️⃣ Sector
    const sectorScore = await getSectorData(sectorName);

    console.log("✅ Sector Score:", sectorScore);

    // 4️⃣ AI Score
    console.log("🤖 AI Analyzing...");

    const aiResult = await calculateAIScore(competitor, personal);

    // Safety clamp
    const competitorScore = Math.min(Number(aiResult.competitorScore), 35);
    const personalScore = Math.min(Number(aiResult.personalScore), 35);

    const finalCredifyScore =
      competitorScore + personalScore + Number(sectorScore.score);

    // Final Response
    const result = {
      competitorScore,
      competitorInsights: aiResult.competitorInsights,
      competitorSuggestions: aiResult.competitorSuggestions,

      personalScore,
      personalInsights: aiResult.personalInsights,
      personalSuggestions: aiResult.personalSuggestions,

      sectorScore,

      finalCredifyScore,
    };

    console.log("\n📊 CREDIFY SCORE RESULT:");
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (err) {
    console.error("\n❌ Orchestration Failed:");
    console.error(err?.message ?? err);

    // Helpful diagnostics for axios errors (e.g., competitor API)
    if (err?.response) {
      console.error("Upstream status:", err.response.status);
      console.error("Upstream data:", err.response.data);
    }

    // Helpful diagnostics for non-Error throws (e.g., rejected stderr)
    if (typeof err === "string") {
      console.error("Raw error string:", err);
    }

    throw err;
  }
}

// =====================================
// 6. API Server
// =====================================

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/credify-score", async (req, res) => {
  try {
    const { lat, lon, category, sectorName, pdfPath, pdfDir } = req.body;

    if (!lat || !lon || !category || !sectorName) {
      return res.status(400).json({
        error: "lat, lon, category, sectorName are required",
      });
    }

    if (!pdfPath && !pdfDir) {
      return res.status(400).json({
        error: "pdfPath (single PDF) or pdfDir (folder of PDFs) is required",
      });
    }

    if (pdfPath) {
      console.log("📄 PDF received:", path.basename(String(pdfPath)));
    }

    const result = await orchestrate(lat, lon, category, sectorName, {
      pdfPath,
      pdfDir,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// =====================================
// 7. Start Server
// =====================================

const PORT = 7000;

app.listen(PORT, () => {
  console.log(`🚀 Credify AI API running on port ${PORT}`);
});
