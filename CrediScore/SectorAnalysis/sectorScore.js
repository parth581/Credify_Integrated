import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load CSV using an absolute path
function loadSectorData() {
  return new Promise((resolve, reject) => {
    const results = [];
    // Forces Node to look in SectorAnalysis/data.csv
    const csvPath = path.join(__dirname, "data.csv");

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

// Convert "7.64%" → 7.64
function parsePercent(value) {
  if (!value || value === "-") return null;
  return parseFloat(value.replace("%", ""));
}

// Main Function
export async function getSectorScore(sectorName) {
  const data = await loadSectorData();

  // Normalize name
  const sector = data.find(
    (s) => s.Sector.toLowerCase() === sectorName.toLowerCase(),
  );

  if (!sector) {
    throw new Error(`Sector "${sectorName}" not found in CSV`);
  }

  const yoy = parsePercent(sector["Sector Earnings YoY"]);

  if (yoy === null) {
    return {
      sector: sectorName,
      score: 0,
      yoy: null,
      reason: "No earnings data",
    };
  }

  const allYoy = data
    .map((s) => parsePercent(s["Sector Earnings YoY"]))
    .filter((v) => v !== null);

  const min = Math.min(...allYoy);
  const max = Math.max(...allYoy);

  // Percentile Normalization (0–30)
  const score = ((yoy - min) / (max - min)) * 30;

  return {
    sector: sectorName,
    yoy: yoy,
    score: Number(score.toFixed(2)),
    minYoy: min,
    maxYoy: max,
  };
}
