import requests
import json
import os
import re
from ai_agent.prompt import build_prompt
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def _extract_json_object(text: str) -> dict:
    """
    LLMs sometimes wrap JSON in fences or append extra prose/code.
    Extract the first JSON object and parse it.
    """
    if text is None:
        raise ValueError("Empty LLM response")

    cleaned = text.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    m = re.search(r"\{[\s\S]*\}", cleaned)
    if not m:
        raise ValueError(f"No JSON object found in response: {cleaned[:200]}")

    candidate = m.group(0)
    return json.loads(candidate)

def run_ai_agent(features: dict) -> dict:
    prompt = build_prompt(features)[:1200]

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "Return JSON only."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 200
        }
    )

    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)

    result = response.json()
    raw = result["choices"][0]["message"]["content"]
    return _extract_json_object(raw)