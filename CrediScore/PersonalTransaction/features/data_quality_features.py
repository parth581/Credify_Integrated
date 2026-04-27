def extract_data_quality_features(df):
    return {
        "statement_days": int(len(df)),
        "total_transactions": int(len(df)),
        "balance_available": True,
        "missing_days_ratio": 0.0
    }
