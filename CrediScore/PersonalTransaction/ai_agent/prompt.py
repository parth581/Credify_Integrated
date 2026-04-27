def build_prompt(features: dict) -> str:
    return f"""
You are a financial classification engine.

Analyze the input JSON and classify:

risk_category: low | medium-low | medium | high
income_pattern: salaried | non_salaried
expense_behavior: controlled | irregular | excessive | risky
balance_behavior: stable | unstable
repayment_behavior: stable | risky

Return ONLY valid JSON in this format:

{{
  "risk_category": "",
  "income_pattern": "",
  "expense_behavior": "",
  "balance_behavior": "",
  "repayment_behavior": "",
  "loan_suitability": {{
    "business_loan": "recommended | conditional | not_recommended",
    "personal_loan": "recommended | conditional | not_recommended"
  }},
  "confidence": 0.0
}}

Input:
{features}
"""