import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# AI STOCK MARKET ANALYSER
# STAGE 2 - 3 CLASS MODEL TRAINING
# ============================================================


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "training_data.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

MODEL_FILE = os.path.join(
    MODEL_DIR,
    "stock_model.pkl"
)

METRICS_FILE = os.path.join(
    MODEL_DIR,
    "model_metrics.json"
)

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# ============================================================
# SETTINGS
# ============================================================

TEST_SIZE = 0.20

RANDOM_STATE = 42

# Reduced from 400 to 100 to reduce model size and memory usage
N_ESTIMATORS = 100


# ============================================================
# TARGET
# ============================================================

# -1 = SELL
#  0 = HOLD
#  1 = BUY

TARGET_COLUMN = "Target"


# ============================================================
# COLUMNS THAT MUST NOT BE USED AS FEATURES
# ============================================================

EXCLUDED_COLUMNS = [
    "Target",
    "Date",
    "Symbol",
    "Future_Close_5D",
    "Future_Return_5D"
]


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print()
    print("=" * 70)
    print("LOADING TRAINING DATA")
    print("=" * 70)

    if not os.path.exists(DATA_FILE):

        raise FileNotFoundError(
            f"Training file not found:\n{DATA_FILE}"
        )

    df = pd.read_csv(
        DATA_FILE
    )

    print()
    print(
        f"Training file: {DATA_FILE}"
    )

    print(
        f"Rows loaded: {len(df):,}"
    )

    print(
        f"Columns loaded: {len(df.columns)}"
    )

    return df


# ============================================================
# CLEAN DATA
# ============================================================

def clean_data(df):

    print()
    print("=" * 70)
    print("CLEANING DATA")
    print("=" * 70)

    df = df.copy()

    if TARGET_COLUMN not in df.columns:

        raise ValueError(
            "Target column is missing from training_data.csv"
        )

    df = df[
        df[TARGET_COLUMN].isin(
            [-1, 0, 1]
        )
    ].copy()

    df = df.replace(
        [
            np.inf,
            -np.inf
        ],
        np.nan
    )

    before = len(df)

    df = df.dropna()

    after = len(df)

    print()
    print(
        f"Rows removed: {before - after:,}"
    )

    print(
        f"Rows remaining: {after:,}"
    )

    return df


# ============================================================
# SHOW TARGET DISTRIBUTION
# ============================================================

def show_target_distribution(df):

    print()
    print("=" * 70)
    print("TARGET DISTRIBUTION")
    print("=" * 70)

    counts = (
        df[TARGET_COLUMN]
        .value_counts()
        .sort_index()
    )

    total = len(df)

    sell = counts.get(
        -1,
        0
    )

    hold = counts.get(
        0,
        0
    )

    buy = counts.get(
        1,
        0
    )

    print()

    print(
        f"SELL (-1): {sell:,} "
        f"({sell / total:.2%})"
    )

    print(
        f"HOLD (0):  {hold:,} "
        f"({hold / total:.2%})"
    )

    print(
        f"BUY (1):   {buy:,} "
        f"({buy / total:.2%})"
    )


# ============================================================
# PREPARE FEATURES
# ============================================================

def prepare_features(df):

    print()
    print("=" * 70)
    print("PREPARING FEATURES")
    print("=" * 70)

    df = df.copy()

    df["Date"] = pd.to_datetime(
        df["Date"]
    )

    df = df.sort_values(
        "Date"
    ).reset_index(
        drop=True
    )

    feature_columns = [
        column
        for column in df.columns
        if column not in EXCLUDED_COLUMNS
    ]

    X = df[
        feature_columns
    ].copy()

    y = df[
        TARGET_COLUMN
    ].copy()

    non_numeric = X.select_dtypes(
        exclude=[np.number]
    ).columns.tolist()

    if non_numeric:

        print()
        print(
            "Removing non-numeric columns:"
        )

        for column in non_numeric:

            print(
                f"  - {column}"
            )

        X = X.drop(
            columns=non_numeric
        )

        feature_columns = [
            column
            for column in feature_columns
            if column not in non_numeric
        ]

    print()
    print(
        f"Features used: {len(feature_columns)}"
    )

    print()
    print("Feature columns:")

    for column in feature_columns:

        print(
            f"  - {column}"
        )

    return df, X, y, feature_columns


# ============================================================
# TIME-BASED TRAIN / TEST SPLIT
# ============================================================

def split_data(df, X, y):

    print()
    print("=" * 70)
    print("CREATING TIME-BASED TRAIN / TEST SPLIT")
    print("=" * 70)

    split_index = int(
        len(df) * (1 - TEST_SIZE)
    )

    X_train = X.iloc[
        :split_index
    ].copy()

    X_test = X.iloc[
        split_index:
    ].copy()

    y_train = y.iloc[
        :split_index
    ].copy()

    y_test = y.iloc[
        split_index:
    ].copy()

    train_dates = df[
        "Date"
    ].iloc[
        :split_index
    ]

    test_dates = df[
        "Date"
    ].iloc[
        split_index:
    ]

    print()
    print(
        f"Training rows: {len(X_train):,}"
    )

    print(
        f"Testing rows:  {len(X_test):,}"
    )

    print()
    print(
        "Training period:"
    )

    print(
        f"{train_dates.min()} "
        f"to "
        f"{train_dates.max()}"
    )

    print()
    print(
        "Testing period:"
    )

    print(
        f"{test_dates.min()} "
        f"to "
        f"{test_dates.max()}"
    )

    return (
        X_train,
        X_test,
        y_train,
        y_test
    )


# ============================================================
# TRAIN MODEL
# ============================================================

def train_model(
    X_train,
    y_train
):

    print()
    print("=" * 70)
    print("TRAINING RANDOM FOREST")
    print("=" * 70)

    print()
    print(
        f"Number of trees: {N_ESTIMATORS}"
    )

    print(
        "Maximum tree depth: 20"
    )

    print(
        "Class balancing: enabled"
    )

    model = RandomForestClassifier(

        n_estimators=N_ESTIMATORS,

        random_state=RANDOM_STATE,

        class_weight="balanced",

        n_jobs=-1,

        max_features="sqrt",

        min_samples_leaf=5,

        max_depth=20
    )

    print()
    print(
        "Training model..."
    )

    model.fit(
        X_train,
        y_train
    )

    print()
    print(
        "Model training complete."
    )

    return model


# ============================================================
# EVALUATE MODEL
# ============================================================

def evaluate_model(
    model,
    X_test,
    y_test
):

    print()
    print("=" * 70)
    print("MODEL EVALUATION")
    print("=" * 70)

    predictions = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0
    )

    print()

    print(
        f"Accuracy:  {accuracy:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall:    {recall:.4f}"
    )

    print(
        f"F1 Score:  {f1:.4f}"
    )

    print()
    print(
        "Classification Report:"
    )

    report = classification_report(
        y_test,
        predictions,
        labels=[
            -1,
            0,
            1
        ],
        target_names=[
            "SELL",
            "HOLD",
            "BUY"
        ],
        zero_division=0
    )

    print(
        report
    )

    print(
        "Confusion Matrix:"
    )

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=[
            -1,
            0,
            1
        ]
    )

    print()

    print(
        "             Predicted"
    )

    print(
        "             SELL  HOLD  BUY"
    )

    print(
        f"Actual SELL  "
        f"{matrix[0][0]:5d} "
        f"{matrix[0][1]:5d} "
        f"{matrix[0][2]:5d}"
    )

    print(
        f"Actual HOLD  "
        f"{matrix[1][0]:5d} "
        f"{matrix[1][1]:5d} "
        f"{matrix[1][2]:5d}"
    )

    print(
        f"Actual BUY   "
        f"{matrix[2][0]:5d} "
        f"{matrix[2][1]:5d} "
        f"{matrix[2][2]:5d}"
    )

    return {
        "accuracy": float(accuracy),
        "precision_macro": float(precision),
        "recall_macro": float(recall),
        "f1_macro": float(f1),
        "test_rows": int(len(y_test)),
        "train_rows": int(len(y_test)),
        "confusion_matrix": matrix.tolist(),
        "classification_report": classification_report(
            y_test,
            predictions,
            labels=[
                -1,
                0,
                1
            ],
            target_names=[
                "SELL",
                "HOLD",
                "BUY"
            ],
            output_dict=True,
            zero_division=0
        )
    }


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

def show_feature_importance(
    model,
    feature_columns
):

    print()
    print("=" * 70)
    print("TOP FEATURE IMPORTANCE")
    print("=" * 70)

    importance = pd.DataFrame({

        "Feature": feature_columns,

        "Importance": model.feature_importances_

    })

    importance = importance.sort_values(
        "Importance",
        ascending=False
    )

    print()

    print(
        importance.head(20).to_string(
            index=False
        )
    )

    return importance


# ============================================================
# SAVE MODEL
# ============================================================

def save_model(
    model,
    feature_columns
):

    print()
    print("=" * 70)
    print("SAVING MODEL")
    print("=" * 70)

    model_package = {

        "model": model,

        "features": feature_columns,

        "classes": [
            -1,
            0,
            1
        ],

        "class_names": {
            "-1": "SELL",
            "0": "HOLD",
            "1": "BUY"
        }

    }

    joblib.dump(
        model_package,
        MODEL_FILE
    )

    print()
    print(
        "Model saved to:"
    )

    print(
        MODEL_FILE
    )


# ============================================================
# SAVE METRICS
# ============================================================

def save_metrics(
    metrics,
    feature_columns
):

    metrics["features"] = len(
        feature_columns
    )

    metrics["feature_names"] = (
        feature_columns
    )

    metrics["target_definition"] = {

        "SELL": "< -2%",

        "HOLD": "-2% to +2%",

        "BUY": "> +2%"

    }

    with open(
        METRICS_FILE,
        "w"
    ) as file:

        json.dump(
            metrics,
            file,
            indent=4
        )

    print()
    print(
        "Metrics saved to:"
    )

    print(
        METRICS_FILE
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("#" * 70)
    print("AI STOCK MARKET ANALYSER")
    print("STAGE 2 - 3 CLASS MODEL TRAINING")
    print("#" * 70)

    print()
    print(
        "Target:"
    )

    print(
        "SELL = -1"
    )

    print(
        "HOLD = 0"
    )

    print(
        "BUY = 1"
    )

    # --------------------------------------------------------
    # Load
    # --------------------------------------------------------

    df = load_data()

    # --------------------------------------------------------
    # Clean
    # --------------------------------------------------------

    df = clean_data(
        df
    )

    # --------------------------------------------------------
    # Target distribution
    # --------------------------------------------------------

    show_target_distribution(
        df
    )

    # --------------------------------------------------------
    # Prepare features
    # --------------------------------------------------------

    (
        df,
        X,
        y,
        feature_columns
    ) = prepare_features(
        df
    )

    # --------------------------------------------------------
    # Split
    # --------------------------------------------------------

    (
        X_train,
        X_test,
        y_train,
        y_test
    ) = split_data(
        df,
        X,
        y
    )

    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    model = train_model(
        X_train,
        y_train
    )

    # --------------------------------------------------------
    # Evaluate
    # --------------------------------------------------------

    metrics = evaluate_model(
        model,
        X_test,
        y_test
    )

    # --------------------------------------------------------
    # Feature importance
    # --------------------------------------------------------

    show_feature_importance(
        model,
        feature_columns
    )

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    save_model(
        model,
        feature_columns
    )

    save_metrics(
        metrics,
        feature_columns
    )

    # ========================================================
    # COMPLETE
    # ========================================================

    print()
    print("#" * 70)
    print("STAGE 2 COMPLETE")
    print("#" * 70)

    print()

    print(
        "The 3-class model has been trained."
    )

    print()

    print(
        f"Accuracy: "
        f"{metrics['accuracy']:.2%}"
    )

    print(
        f"Macro Precision: "
        f"{metrics['precision_macro']:.2%}"
    )

    print(
        f"Macro Recall: "
        f"{metrics['recall_macro']:.2%}"
    )

    print(
        f"Macro F1: "
        f"{metrics['f1_macro']:.2%}"
    )

    print()

    print(
        "Model:"
    )

    print(
        MODEL_FILE
    )

    print()

    print(
        "Metrics:"
    )

    print(
        METRICS_FILE
    )

    print()

    print(
        "Next step: Stage 3 - live prediction."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()
