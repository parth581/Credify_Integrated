def extract_transaction_features(df):
    credits = df[df["txn_type"] == "credit"]
    debits = df[df["txn_type"] == "debit"]

    repeat_ratio = (
        credits["counterparty_id"]
        .value_counts()
        .gt(1)
        .mean()
        if len(credits) > 0 else 0
    )

    return {
        "total_credits": int(len(credits)),
        "total_debits": int(len(debits)),
        "avg_credit_amount": float(credits["amount"].mean() or 0),
        "avg_debit_amount": float(debits["amount"].mean() or 0),
        "repeat_counterparty_ratio": float(repeat_ratio)
    }
