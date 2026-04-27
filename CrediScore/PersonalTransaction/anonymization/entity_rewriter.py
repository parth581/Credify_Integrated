import pandas as pd

def anonymize_transactions(df: pd.DataFrame) -> pd.DataFrame:
    entity_map = {}
    entity_counter = 1
    safe_rows = []

    for _, row in df.iterrows():
        narration = str(row["narration"])

        if narration not in entity_map:
            entity_map[narration] = f"ENTITY_{entity_counter}"
            entity_counter += 1

        credit = row.get("credit")
        debit = row.get("debit")

        # Prefer whichever side has a real numeric value.
        if pd.notna(credit) and float(credit) != 0:
            txn_type = "credit"
            amount = credit
        elif pd.notna(debit) and float(debit) != 0:
            txn_type = "debit"
            amount = debit
        else:
            # Skip rows without any amount
            continue

        safe_rows.append({
            "txn_type": txn_type,
            "amount": float(amount),
            "counterparty_id": entity_map[narration],
            "balance": float(row["balance"]) if pd.notna(row.get("balance")) else 0.0
        })

    return pd.DataFrame(safe_rows)
