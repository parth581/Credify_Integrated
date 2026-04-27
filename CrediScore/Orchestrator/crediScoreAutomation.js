import axios from "axios";
import XLSX from "xlsx";
import fs from "fs";

const API_URL = "http://localhost:7000/api/credify-score";
const TOTAL_RUNS = 50; // adjust safely for Gemini free tier
const DELAY_MS = 2000; // 2 sec delay (safe mode)

const filePath = "./credify_results.xlsx";

// ---------- Utilities ----------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateStats(scores) {
  const mean = scores.reduce((sum, val) => sum + val, 0) / scores.length;

  const variance =
    scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    scores.length;

  const stdDev = Math.sqrt(variance);

  const min = Math.min(...scores);
  const max = Math.max(...scores);

  const volatility = max - min;

  const consistency = 100 - (stdDev / mean) * 100; // higher = more stable

  return {
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    volatility: Number(volatility.toFixed(2)),
    consistency: Number(consistency.toFixed(2)),
  };
}

function detectDrift(scores) {
  if (scores.length < 5) return "Not enough data";

  const recent = scores.slice(-5);
  const earlier = scores.slice(0, 5);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

  const diff = recentAvg - earlierAvg;

  if (Math.abs(diff) > 5) {
    return `⚠ Drift Detected (${diff.toFixed(2)} shift)`;
  }

  return "Stable";
}

// ---------- Test Inputs ----------

const testInputs = Array.from({ length: TOTAL_RUNS }, () => ({
  lat: 19.0453395,
  lon: 72.8893735,
  category: "restaurant",
  sectorName: "Hospitality",
}));

// ---------- API Call ----------

async function callCredifyAPI(input, index) {
  try {
    await sleep(DELAY_MS);

    const response = await axios.post(API_URL, input, {
      timeout: 40000,
    });

    const result = response.data.data;

    console.log(`✅ Run ${index + 1} Success`);

    return {
      Timestamp: new Date().toISOString(),
      Category: input.category,
      "Competitor Score": result.competitorScore,
      "Personal Score": result.personalScore,
      "Sector Score": result.sectorScore.score,
      "Final Score": result.finalCredifyScore,
      "Competitor Reason": result.competitorReason,
      "Personal Reason": result.personalReason,
      "AI Summary": result.summary,
    };
  } catch (error) {
    console.error(`❌ Run ${index + 1} Failed:`, error.message);
    return null;
  }
}

// ---------- Main Runner ----------

async function runAutomation() {
  console.log("🚀 Starting Credify Evaluation...\n");

  const results = [];

  for (let i = 0; i < testInputs.length; i++) {
    const res = await callCredifyAPI(testInputs[i], i);
    if (res) results.push(res);
  }

  if (results.length === 0) {
    console.log("No successful results.");
    return;
  }

  const finalScores = results.map((r) => r["Final Score"]);

  const stats = calculateStats(finalScores);
  const driftStatus = detectDrift(finalScores);

  console.log("\n📊 MODEL ANALYSIS:");
  console.log("Mean:", stats.mean);
  console.log("Std Dev:", stats.stdDev);
  console.log("Volatility:", stats.volatility);
  console.log("Consistency %:", stats.consistency);
  console.log("Drift:", driftStatus);

  // Add stats summary row
  results.push({
    Timestamp: "MODEL SUMMARY",
    Category: "-",
    "Competitor Score": "-",
    "Personal Score": "-",
    "Sector Score": "-",
    "Final Score": `Mean: ${stats.mean}`,
    "Competitor Reason": `Std Dev: ${stats.stdDev}`,
    "Personal Reason": `Volatility: ${stats.volatility}`,
    "AI Summary": `Consistency: ${stats.consistency}% | Drift: ${driftStatus}`,
  });

  let workbook;
  let worksheet;

  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath);
    worksheet = workbook.Sheets["Credify Results"];
    const existingData = XLSX.utils.sheet_to_json(worksheet);
    const updatedData = [...existingData, ...results];
    worksheet = XLSX.utils.json_to_sheet(updatedData);
    workbook.Sheets["Credify Results"] = worksheet;
  } else {
    workbook = XLSX.utils.book_new();
    worksheet = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credify Results");
  }

  XLSX.writeFile(workbook, filePath);

  console.log(
    "\n🎉 Evaluation Complete. Results stored in credify_results.xlsx",
  );
}

runAutomation();
