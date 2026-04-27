import axios from "axios";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  model: "gemini-2.5-flash",
});

// =====================================
// 1. Competitor API
// =====================================
async function getCompetitorData(lat, lon, category, radius = 1000) {
  console.log(lat);
  console.log(category);
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

  console.log(res);
  return res.data;
}

// =====================================
// 2. Personal Transaction Runner
// =====================================
function runPersonalTransaction() {
  console.log("Hello");
  return new Promise((resolve, reject) => {
    const pythonDir = path.join(__dirname, "../PersonalTransaction");
    //console.log(pythonDir);
    const script = path.join(pythonDir, "main.py");
    //console.log(script);
    const pythonExe = path.join(pythonDir, "venv", "Scripts", "python.exe");
    //console.log(pythonExe);
    exec(
      `"${pythonExe}" "${script}"`,
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
  return await getSectorScore(sector); // returns score out of 30
}

// =====================================
// 4. AI SCORING (NO SECTOR HERE)
// =====================================
async function calculateAIScore(competitor, personal) {
  const prompt = `
You are a financial risk and business viability analyst.

Evaluate ONLY the following two parts:

1. Competitor Analysis (Max 35):
   - Number of competitors
   - Market saturation
   - Radius coverage
   - Demand vs supply

2. Personal Financial Analysis (Max 35):
   - Income stability
   - Risk category
   - Credit discipline
   - Spending pattern
   - Debt behavior

DO NOT score sector.

---

INPUT DATA:

Competitor Data:
${JSON.stringify(competitor, null, 2)}

Personal Transaction:
${JSON.stringify(personal, null, 2)}

---

OUTPUT STRICT JSON ONLY:

{
  "competitorScore": number,
  "competitorReason": string,

  "personalScore": number,
  "personalReason": string,

  "summary": string
}
`;

  const result = await model.generateContent(prompt);

  const text = result.response.text();

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");

  const jsonString = text.slice(first, last + 1);

  return JSON.parse(jsonString);
}

// =====================================
// 5. Orchestrator (Now Accepts Params)
// =====================================
async function orchestrate(lat, lon, category, sectorName) {
  try {
    console.log("\n🚀 Running AI Orchestrator...\n");

    // 1️⃣ Competitor
    const competitor = await getCompetitorData(lat, lon, category);
    console.log(competitor);

    console.log("✅ Competitor Loaded");

    // 2️⃣ Personal
    const personalRaw = await runPersonalTransaction();

    let personal;

    try {
      personal = JSON.parse(personalRaw);
    } catch {
      personal = { raw: personalRaw };
    }

    console.log("✅ Personal Loaded");

    // 3️⃣ Sector (Rule Based)
    const sectorScore = await getSectorData(sectorName);

    console.log("✅ Sector Score:", sectorScore);

    // 4️⃣ AI Score
    console.log("🤖 AI Analyzing...");

    const aiResult = await calculateAIScore(competitor, personal);

    // 5️⃣ Final Score Calculation
    const finalCredifyScore =
      Number(aiResult.competitorScore) +
      Number(aiResult.personalScore) +
      Number(sectorScore.score);

    // 6️⃣ Final Output
    const result = {
      competitorScore: aiResult.competitorScore,
      competitorReason: aiResult.competitorReason,

      personalScore: aiResult.personalScore,
      personalReason: aiResult.personalReason,

      sectorScore: sectorScore,

      finalCredifyScore,

      summary: aiResult.summary,
    };

    console.log("\n📊 CREDIFY SCORE RESULT:");
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (err) {
    console.error("\n❌ Orchestration Failed:");
    console.error(err.message);

    throw err;
  }
}

// =====================================
// 6. API Server
// =====================================
import express from "express";

const app = express();
app.use(cors());
app.use(express.json());

// POST API
app.post("/api/credify-score", async (req, res) => {
  try {
    const { lat, lon, category, sectorName } = req.body;

    // Validation
    if (!lat || !lon || !category || !sectorName) {
      return res.status(400).json({
        error: "lat, lon, category, sectorName are required",
      });
    }

    const result = await orchestrate(lat, lon, category, sectorName);

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
