import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure the API Key exists
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    // 1. Validate Input
    const body = await req.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY in .env.local");
      return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    // 2. Define System Instructions (Hindi + English Support)
    const systemInstruction = `
      You are the Credify Business Loan Assistant.
      
      LANGUAGE RULES:
      - If the user speaks in Hindi, reply in professional Hindi.
      - If the user speaks in English, reply in English.
      - You can use Hinglish (Hindi + English) if the user does.

      LOAN COLLECTION GOAL:
      Collect these 4 details:
      1. Amount (in INR)
      2. Purpose (Specific business reason)
      3. Duration (in months)
      4. Max Interest Rate (percentage)

      JSON TRIGGER:
      - Once ALL 4 pieces are collected, return ONLY the JSON object.
      - The JSON must be in English regardless of the conversation language.
      - Do NOT use markdown formatting (no \`\`\`json blocks).

      JSON FORMAT:
      {
        "intent": "loan_request",
        "data": {
          "amount": number,
          "purpose": "string",
          "duration": number,
          "rate": number,
          "isBusinessLoan": true,
          "category": "Business"
        }
      }
    `;

    // 3. Initialize Model (Using a widely supported stable version)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction 
    });

    // 4. Stable History Mapping (Prevents 500 crashes)
    const formattedHistory = (history || []).map((m: any) => {
      // Logic to find text regardless of if it's m.text or m.parts[0].text
      const textContent = m.text || (m.parts && m.parts[0]?.text) || "";
      return {
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: textContent }],
      };
    });

    // 5. Generate Response
    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({ reply });

  } catch (err: any) {
    // Logs the actual error to your terminal for debugging
    console.error("AI_ROUTE_ERROR:", err);
    
    return NextResponse.json(
      { error: err.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
} 