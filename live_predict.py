import os
import pickle

import pandas as pd
import yfinance as yf

from ml.features import create_features


# ============================================================
# SETTINGS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "stock_model.pkl")

STOCK_SYMBOLS = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "HDFC": "HDFCBANK.NS",
    "ITC": "ITC.NS"
}


# ============================================================
# SAME 37 FEATURES USED FOR TRAINING
# ============================================================

FEATURE_COLUMNS = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume",
    "Return_1D",
    "Return_5D",
    "Return_20D",
    "SMA_10",
    "SMA_20",
    "SMA_50",
    "SMA_200",
    "EMA_12",
    "EMA_26",
    "RSI",
    "MACD",
    "MACD_Signal",
    "MACD_Histogram",
    "BB_High",
    "BB_Low",
    "BB_Middle",
    "BB_Width",
    "ATR",
    "ADX",
    "Volume_Change",
    "Volume_SMA_20",
    "Volume_Ratio",
    "Volatility_20D",
    "Price_vs_SMA20",
    "Price_vs_SMA50",
    "Price_vs_SMA200",
    "Daily_Range",
    "NIFTY_Close",
    "NIFTY_Return_1D",
    "NIFTY_Return_5D",
    "NIFTY_SMA20",
    "NIFTY_Trend"
]


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

def load_model():

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found: {MODEL_PATH}"
        )

    with open(
        MODEL_PATH,
        "rb"
    ) as file:

        model = pickle.load(file)

    return model


# ============================================================
# DOWNLOAD STOCK DATA
# ============================================================

def get_stock_data(symbol):

    ticker = STOCK_SYMBOLS[symbol]

    print(
        f"Downloading {symbol} data..."
    )
    data = yf.download(
         ticker,
         period="2y",
         interval="1d",
         auto_adjust=False,
         progress=False,
         threads=False,
         timeout=10
    )
   
    if data.empty:

        raise ValueError(
            f"No data found for {symbol}"
        )

    # yfinance can return MultiIndex columns
    if isinstance(
        data.columns,
        pd.MultiIndex
    ):

        data.columns = (
            data.columns
            .get_level_values(0)
        )

    data = data.reset_index()

    # Convert Date
    data["Date"] = pd.to_datetime(
        data["Date"]
    )

    # Remove timezone if present
    try:

        data["Date"] = (
            data["Date"]
            .dt.tz_localize(None)
        )

    except TypeError:
        pass

    return data


# ============================================================
# DOWNLOAD NIFTY DATA
# ============================================================

def get_nifty_data():

    print(
        "Downloading NIFTY 50 data..."
    )

    data = yf.download(
         "^NSEI",
         period="2y",
         interval="1d",
         auto_adjust=False,
         progress=False,
         threads=False,
         timeout=10
    )

    if data.empty:

        raise ValueError(
            "No NIFTY 50 data found"
        )

    if isinstance(
        data.columns,
        pd.MultiIndex
    ):

        data.columns = (
            data.columns
            .get_level_values(0)
        )

    data = data.reset_index()

    data["Date"] = pd.to_datetime(
        data["Date"]
    )

    try:

        data["Date"] = (
            data["Date"]
            .dt.tz_localize(None)
        )

    except TypeError:
        pass

    return data


# ============================================================
# PREDICT STOCK
# ============================================================

def predict_stock(symbol):

    symbol = symbol.upper()

    if symbol not in STOCK_SYMBOLS:

        raise ValueError(
            f"Unsupported stock: {symbol}"
        )

    # --------------------------------------------------------
    # 1. Download stock data
    # --------------------------------------------------------

    stock_data = get_stock_data(
        symbol
    )

    # --------------------------------------------------------
    # 2. Download NIFTY data
    # --------------------------------------------------------

    nifty_data = get_nifty_data()

    # --------------------------------------------------------
    # 3. Create features
    # --------------------------------------------------------

    df = create_features(
        stock_data,
        nifty_data
    )

    # --------------------------------------------------------
    # 4. Check features
    # --------------------------------------------------------

    missing_features = [
        feature
        for feature in FEATURE_COLUMNS
        if feature not in df.columns
    ]

    if missing_features:

        raise ValueError(
            "Missing features: "
            + str(missing_features)
        )

    # --------------------------------------------------------
    # 5. Select the 37 features
    # --------------------------------------------------------

    feature_data = df[
        FEATURE_COLUMNS
    ].copy()

    # Replace infinity
    feature_data = feature_data.replace(
        [float("inf"), float("-inf")],
        float("nan")
    )

    # Find rows with complete features
    valid_rows = feature_data.dropna()

    if valid_rows.empty:

        raise ValueError(
            "No valid feature row available."
        )

    # Latest complete row
    latest_features = valid_rows.iloc[
        [-1]
    ]

    # --------------------------------------------------------
    # 6. Load model
    # --------------------------------------------------------

    model = load_model()

    # --------------------------------------------------------
    # 7. Make prediction
    # --------------------------------------------------------

    prediction = model.predict(
        latest_features
    )[0]

    # --------------------------------------------------------
    # 8. Get probabilities
    # --------------------------------------------------------

    probabilities = model.predict_proba(
        latest_features
    )[0]

    classes = model.classes_

    probability_map = {
        int(cls): float(probability)
        for cls, probability
        in zip(classes, probabilities)
    }

    # --------------------------------------------------------
    # 9. Convert prediction
    # --------------------------------------------------------

    labels = {
        -1: "SELL",
        0: "HOLD",
        1: "BUY"
    }

    prediction_label = labels.get(
        int(prediction),
        "UNKNOWN"
    )

    confidence = (
        probability_map
        .get(int(prediction), 0)
        * 100
    )

    # --------------------------------------------------------
    # 10. Latest price
    # --------------------------------------------------------

    latest_row = df.iloc[-1]

    price = float(
        latest_row["Close"]
    )

    date = str(
        latest_row["Date"].date()
    )

    # --------------------------------------------------------
    # 11. Result
    # --------------------------------------------------------

    result = {

        "symbol": symbol,

        "price": round(
            price,
            2
        ),

        "date": date,

        "prediction": prediction_label,

        "confidence": round(
            confidence,
            2
        ),

        "probabilities": {

            "SELL": round(
                probability_map.get(
                    -1,
                    0
                ) * 100,
                2
            ),

            "HOLD": round(
                probability_map.get(
                    0,
                    0
                ) * 100,
                2
            ),

            "BUY": round(
                probability_map.get(
                    1,
                    0
                ) * 100,
                2
            )
        }
    }

    return result


# ============================================================
# TEST ALL STOCKS
# ============================================================

if __name__ == "__main__":

    print()
    print("==============================")
    print("STAGE 3 - LIVE PREDICTION")
    print("==============================")
    print()

    for symbol in STOCK_SYMBOLS:

        try:

            result = predict_stock(
                symbol
            )

            print()
            print("------------------------------")
            print(
                "Stock:",
                result["symbol"]
            )

            print(
                "Price:",
                result["price"]
            )

            print(
                "Date:",
                result["date"]
            )

            print(
                "Prediction:",
                result["prediction"]
            )

            print(
                "Confidence:",
                str(
                    result["confidence"]
                ) + "%"
            )

            print(
                "SELL:",
                str(
                    result["probabilities"]["SELL"]
                ) + "%"
            )

            print(
                "HOLD:",
                str(
                    result["probabilities"]["HOLD"]
                ) + "%"
            )

            print(
                "BUY:",
                str(
                    result["probabilities"]["BUY"]
                ) + "%"
            )

        except Exception as error:

            print()
            print(
                symbol,
                "ERROR:",
                error
            )

    print()
    print("==============================")
    print("STAGE 3 TEST COMPLETE")
    print("==============================")
