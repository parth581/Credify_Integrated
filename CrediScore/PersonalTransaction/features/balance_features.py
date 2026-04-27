def extract_balance_features(df):
    return {
        "min_balance": float(df["balance"].min()),
        "avg_balance": float(df["balance"].mean()),
        "balance_volatility": float(
            df["balance"].std() / df["balance"].mean()
            if df["balance"].mean() else 0
        )
    }
