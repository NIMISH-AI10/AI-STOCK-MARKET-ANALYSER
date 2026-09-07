import os
import pandas as pd

from ml.data_loader import (
    download_all,
    STOCKS
)

from ml.features import (
    create_features
)


# ============================================================
# AI STOCK MARKET ANALYSER
# STAGE 1 - DATA COLLECTION + FEATURE ENGINEERING
# ============================================================


# ============================================================
# DIRECTORIES
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

RAW_DIR = os.path.join(
    BASE_DIR,
    "data",
    "raw"
)

PROCESSED_DIR = os.path.join(
    BASE_DIR,
    "data",
    "processed"
)

os.makedirs(
    RAW_DIR,
    exist_ok=True
)

os.makedirs(
    PROCESSED_DIR,
    exist_ok=True
)


# ============================================================
# TARGET SETTINGS
# ============================================================

# Prediction period:
# Next 5 trading days
#
# BUY:
# Future return > +2%
#
# HOLD:
# Future return between -2% and +2%
#
# SELL:
# Future return < -2%
#
# Target:
# -1 = SELL
#  0 = HOLD
#  1 = BUY


BUY_THRESHOLD = 0.02

SELL_THRESHOLD = -0.02


# ============================================================
# CREATE 3-CLASS TARGET
# ============================================================

def create_target(df):

    df = df.copy()

    # Check that future return exists
    if "Future_Return_5D" not in df.columns:

        raise ValueError(
            "Future_Return_5D column is missing."
        )

    # Remove rows where future return is unavailable
    df = df.dropna(
        subset=[
            "Future_Return_5D"
        ]
    ).copy()

    # Default = HOLD
    df["Target"] = 0

    # BUY
    df.loc[
        df["Future_Return_5D"] > BUY_THRESHOLD,
        "Target"
    ] = 1

    # SELL
    df.loc[
        df["Future_Return_5D"] < SELL_THRESHOLD,
        "Target"
    ] = -1

    return df


# ============================================================
# PROCESS ONE STOCK
# ============================================================

def process_stock(
    symbol,
    stock_data,
    nifty_data
):

    print()
    print("-" * 70)
    print(
        f"Creating features for {symbol}"
    )
    print("-" * 70)

    try:

        # ----------------------------------------------------
        # Create technical features
        # ----------------------------------------------------

        processed = create_features(
            stock_data,
            nifty_data
        )

        # ----------------------------------------------------
        # Create 3-class target
        # ----------------------------------------------------

        processed = create_target(
            processed
        )

        # ----------------------------------------------------
        # Add symbol
        # ----------------------------------------------------

        processed["Symbol"] = symbol

        # ----------------------------------------------------
        # Remove infinite values
        # ----------------------------------------------------

        processed = processed.replace(
            [
                float("inf"),
                float("-inf")
            ],
            float("nan")
        )

        # ----------------------------------------------------
        # Remove remaining missing values
        # ----------------------------------------------------

        processed = processed.dropna()

        # ----------------------------------------------------
        # Sort by date
        # ----------------------------------------------------

        processed = processed.sort_values(
            "Date"
        ).reset_index(
            drop=True
        )

        # ----------------------------------------------------
        # Save individual stock dataset
        # ----------------------------------------------------

        output_file = os.path.join(
            PROCESSED_DIR,
            f"{symbol}_features.csv"
        )

        processed.to_csv(
            output_file,
            index=False
        )

        print(
            f"Saved: {output_file}"
        )

        print(
            f"Rows: {len(processed):,}"
        )

        # ----------------------------------------------------
        # Target distribution
        # ----------------------------------------------------

        target_counts = (
            processed["Target"]
            .value_counts()
            .sort_index()
        )

        print()
        print("Target distribution:")

        print(
            f"SELL (-1): "
            f"{target_counts.get(-1, 0):,}"
        )

        print(
            f"HOLD (0):  "
            f"{target_counts.get(0, 0):,}"
        )

        print(
            f"BUY (1):   "
            f"{target_counts.get(1, 0):,}"
        )

        return processed

    except Exception as e:

        print()
        print(
            f"ERROR processing {symbol}: {e}"
        )

        return None


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 70)
    print("AI STOCK MARKET ANALYSER")
    print("STAGE 1 - DATA COLLECTION + FEATURE ENGINEERING")
    print("=" * 70)

    print()
    print("TARGET:")
    print("-" * 70)

    print(
        "BUY  = future 5-day return > +2%"
    )

    print(
        "HOLD = future 5-day return between -2% and +2%"
    )

    print(
        "SELL = future 5-day return < -2%"
    )

    print()
    print("Target values:")
    print("SELL = -1")
    print("HOLD =  0")
    print("BUY  =  1")

    # ========================================================
    # DOWNLOAD DATA
    # ========================================================

    print()
    print("=" * 70)
    print("DOWNLOADING HISTORICAL DATA")
    print("=" * 70)

    datasets = download_all(
        period="10y"
    )

    if not datasets:

        print()
        print(
            "ERROR: No datasets downloaded."
        )

        return

    # ========================================================
    # GET NIFTY DATA
    # ========================================================

    nifty_data = datasets.get(
        "NIFTY50"
    )

    if nifty_data is None:

        print()
        print(
            "WARNING: NIFTY50 data was not found."
        )

        print(
            "Stocks will still be processed."
        )

    # ========================================================
    # PROCESS STOCKS
    # ========================================================

    all_data = []

    successful = 0

    failed = 0

    for symbol in STOCKS:

        if symbol not in datasets:

            print()
            print(
                f"Skipping {symbol}: "
                "no raw data."
            )

            failed += 1

            continue

        processed = process_stock(
            symbol,
            datasets[symbol],
            nifty_data
        )

        if processed is None:

            failed += 1

            continue

        if processed.empty:

            print(
                f"WARNING: {symbol} "
                "produced no usable data."
            )

            failed += 1

            continue

        all_data.append(
            processed
        )

        successful += 1

    # ========================================================
    # CHECK RESULTS
    # ========================================================

    if not all_data:

        print()
        print(
            "ERROR: No processed datasets."
        )

        return

    # ========================================================
    # COMBINE DATA
    # ========================================================

    print()
    print("=" * 70)
    print("CREATING COMBINED TRAINING DATASET")
    print("=" * 70)

    combined = pd.concat(
        all_data,
        ignore_index=True
    )

    # Sort by symbol and date
    combined = combined.sort_values(
        [
            "Symbol",
            "Date"
        ]
    ).reset_index(
        drop=True
    )

    # ========================================================
    # SAVE TRAINING DATA
    # ========================================================

    combined_file = os.path.join(
        PROCESSED_DIR,
        "training_data.csv"
    )

    combined.to_csv(
        combined_file,
        index=False
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    print()
    print("=" * 70)
    print("DATASET SUMMARY")
    print("=" * 70)

    print()

    print(
        f"Stocks processed: "
        f"{successful}"
    )

    print(
        f"Stocks failed/skipped: "
        f"{failed}"
    )

    print(
        f"Total rows: "
        f"{len(combined):,}"
    )

    print(
        f"Total columns: "
        f"{len(combined.columns)}"
    )

    print()
    print(
        "Training file:"
    )

    print(
        combined_file
    )

    # ========================================================
    # DATE RANGE
    # ========================================================

    print()
    print("Date range:")

    print(
        f"{combined['Date'].min()} "
        f"to "
        f"{combined['Date'].max()}"
    )

    # ========================================================
    # OVERALL TARGET DISTRIBUTION
    # ========================================================

    print()
    print("=" * 70)
    print("OVERALL TARGET DISTRIBUTION")
    print("=" * 70)

    target_counts = (
        combined["Target"]
        .value_counts()
        .sort_index()
    )

    total = len(combined)

    sell_count = target_counts.get(
        -1,
        0
    )

    hold_count = target_counts.get(
        0,
        0
    )

    buy_count = target_counts.get(
        1,
        0
    )

    print()

    print(
        f"SELL (-1): "
        f"{sell_count:,} "
        f"({sell_count / total:.2%})"
    )

    print(
        f"HOLD (0):  "
        f"{hold_count:,} "
        f"({hold_count / total:.2%})"
    )

    print(
        f"BUY (1):   "
        f"{buy_count:,} "
        f"({buy_count / total:.2%})"
    )

    # ========================================================
    # DATASET PREVIEW
    # ========================================================

    print()
    print("=" * 70)
    print("DATASET PREVIEW")
    print("=" * 70)

    preview_columns = [
        "Date",
        "Symbol",
        "Close",
        "RSI",
        "MACD",
        "Future_Return_5D",
        "Target"
    ]

    available_columns = [
        column
        for column in preview_columns
        if column in combined.columns
    ]

    print()

    print(
        combined[
            available_columns
        ].head(10).to_string(
            index=False
        )
    )

    # ========================================================
    # COMPLETE
    # ========================================================

    print()
    print("=" * 70)
    print("STAGE 1 COMPLETE")
    print("=" * 70)

    print()
    print(
        "Training dataset is ready."
    )

    print()
    print(
        "SELL = -1"
    )

    print(
        "HOLD = 0"
    )

    print(
        "BUY = 1"
    )

    print()
    print(
        "Next step: train the 3-class ML model."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()