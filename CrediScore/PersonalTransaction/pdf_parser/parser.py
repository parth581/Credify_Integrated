import pdfplumber
import pandas as pd
import re
from typing import Dict, List, Optional

def parse_pdf(pdf_path: str) -> pd.DataFrame:
    rows = []

    def _norm(s: object) -> str:
        s = "" if s is None else str(s)
        return re.sub(r"\\s+", " ", s).strip().lower()

    def _parse_amount(v: object) -> Optional[float]:
        if v is None:
            return None
        s = str(v).strip()
        if not s or s == "-":
            return None
        # Remove commas and currency markers; keep digits, dot, minus.
        s = re.sub(r"[^0-9.\\-]", "", s.replace(",", ""))
        if not s or s == "-" or s == ".":
            return None
        try:
            return float(s)
        except ValueError:
            return None

    def _pick_mapping(headers: List[str]) -> Dict[str, int]:
        """
        Maps a variety of bank statement headers to the canonical schema:
        date, narration, debit, credit, balance
        """
        h = [_norm(x) for x in headers]

        def find_idx(preds: List[str]) -> Optional[int]:
            for i, name in enumerate(h):
                if any(p in name for p in preds):
                    return i
            return None

        # Support common variants (your PDFs: Txn Date, Description, Withdrawals (Dr), Deposits (Cr), Balance (INR))
        idx_date = find_idx(["txn date", "transaction date", "date"])
        idx_narr = find_idx(["description", "narration", "particular", "remarks"])
        idx_debit = find_idx(["withdrawal", "withdrawals", "debit", "dr"])
        idx_credit = find_idx(["deposit", "deposits", "credit", "cr"])
        idx_balance = find_idx(["balance"])

        mapping = {
            "date": idx_date,
            "narration": idx_narr,
            "debit": idx_debit,
            "credit": idx_credit,
            "balance": idx_balance,
        }

        missing = [k for k, v in mapping.items() if v is None]
        if missing:
            raise ValueError(f"Could not map required columns from headers: {headers}. Missing: {missing}")

        return {k: int(v) for k, v in mapping.items()}  # type: ignore[arg-type]

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            table = page.extract_table()
            if not table:
                continue

            headers = table[0]
            try:
                mapping = _pick_mapping(headers)
            except Exception:
                # If the first row isn't headers, skip this page (or table format unsupported)
                continue

            for row in table[1:]:
                # Guard against short rows
                if not row or len(row) <= max(mapping.values()):
                    continue

                rows.append(
                    {
                        "date": row[mapping["date"]],
                        "narration": row[mapping["narration"]],
                        "debit": row[mapping["debit"]],
                        "credit": row[mapping["credit"]],
                        "balance": row[mapping["balance"]],
                    }
                )

    df = pd.DataFrame(rows)
    if df.empty:
        return df

    df["debit"] = df["debit"].map(_parse_amount)
    df["credit"] = df["credit"].map(_parse_amount)
    df["balance"] = df["balance"].map(_parse_amount)

    return df
