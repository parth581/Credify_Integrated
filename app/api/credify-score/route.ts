import { NextResponse } from "next/server";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";

export const runtime = "nodejs";

function safeName(name: string) {
  return (name || "statement.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const lat = String(form.get("lat") ?? "");
    const lon = String(form.get("lon") ?? "");
    const category = String(form.get("category") ?? "");
    const sectorName = String(form.get("sectorName") ?? "");
    const pdf = form.get("pdf");

    if (!lat || !lon || !category || !sectorName) {
      return NextResponse.json(
        { success: false, error: "lat, lon, category, sectorName are required" },
        { status: 400 },
      );
    }

    if (!(pdf instanceof File)) {
      return NextResponse.json(
        { success: false, error: "pdf file is required" },
        { status: 400 },
      );
    }

    // Save uploaded PDF to a stable location on disk
    const uploadsDir = path.join(
      process.cwd(),
      "CrediScore",
      "Orchestrator",
      "uploads",
    );
    await fs.mkdir(uploadsDir, { recursive: true });

    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const filename = `${id}-${safeName(pdf.name)}`;
    const absPath = path.join(uploadsDir, filename);

    const buf = Buffer.from(await pdf.arrayBuffer());
    await fs.writeFile(absPath, buf);

    // Call the unchanged Orchestrator (expects JSON body with pdfPath)
    const upstreamRes = await fetch("http://localhost:7000/api/credify-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat,
        lon,
        category,
        sectorName,
        pdfPath: absPath,
      }),
    });

    const data = await upstreamRes.json().catch(() => null);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || "Orchestrator error",
        },
        { status: upstreamRes.status },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}

