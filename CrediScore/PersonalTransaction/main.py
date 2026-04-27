from pdf_parser.parser import parse_pdf
from anonymization.entity_rewriter import anonymize_transactions
from features.transaction_features import extract_transaction_features
from features.balance_features import extract_balance_features
from features.data_quality_features import extract_data_quality_features
from ai_agent.llm_client import run_ai_agent
# from config.model_config import GEMINI_API_KEY
import argparse
import json
from pathlib import Path


def analyze_statement(pdf_path: str) -> dict:
    """
    End-to-end pipeline:
    PDF → anonymization → feature extraction → AI analysis
    """
    # Step 1: Parse PDF
    raw_df = parse_pdf(pdf_path)

    # Step 2: Anonymize sensitive data
    safe_df = anonymize_transactions(raw_df)

    # Step 3: Feature extraction
    # features = {
    #     "transaction": extract_transaction_features(safe_df),
    #     "balance": extract_balance_features(safe_df),
    #     "data_quality": extract_data_quality_features(safe_df)
    # }

    txn = extract_transaction_features(safe_df)
    bal = extract_balance_features(safe_df)

    # 🔹 Compressed features (token optimized)
    features = {
        "credits": txn["total_credits"],
        "avg_credit": txn["avg_credit_amount"],
        "debits": txn["total_debits"],
        "avg_debit": txn["avg_debit_amount"],
        "balance": bal["avg_balance"],
        "volatility": bal["balance_volatility"]
    }

    

    # Step 4: AI analysis (Gemini)
    return run_ai_agent(features)


if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser(description="Analyze bank statement PDF(s).")
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument("--pdf", help="Path to a single PDF statement file.")
        group.add_argument("--pdf-dir", help="Path to a folder containing PDF files.")
        parser.add_argument(
            "--out",
            help="Optional output JSON path (single PDF) or output folder (pdf-dir).",
        )
        args = parser.parse_args()

        if args.pdf:
            result = analyze_statement(args.pdf)
            if args.out:
                Path(args.out).write_text(json.dumps(result, indent=2), encoding="utf-8")
            else:
                print(json.dumps(result, indent=2))
        else:
            pdf_dir = Path(args.pdf_dir)
            if not pdf_dir.exists() or not pdf_dir.is_dir():
                raise ValueError(f"--pdf-dir is not a directory: {pdf_dir}")

            out_dir = Path(args.out) if args.out else (pdf_dir / "outputs")
            out_dir.mkdir(parents=True, exist_ok=True)

            results = {}
            for pdf_path in sorted(pdf_dir.glob("*.pdf")):
                result = analyze_statement(str(pdf_path))
                results[pdf_path.name] = result
                (out_dir / f"{pdf_path.stem}.json").write_text(
                    json.dumps(result, indent=2),
                    encoding="utf-8",
                )

            print(json.dumps({"output_dir": str(out_dir), "results": results}, indent=2))

    except Exception as e:
        # Keep console output ASCII-safe on Windows terminals.
        print("\nERROR OCCURRED:\n")
        print(str(e))