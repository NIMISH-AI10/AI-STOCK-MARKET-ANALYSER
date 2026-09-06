import os
import pickle
import time

import pandas as pd
import yfinance as yf
from curl_cffi import requests

from ml.features import create_features


# ============================================================
# SETTINGS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "stock_model.pkl")

CACHE_SECONDS = 600  # 10 minutes

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
# SIMPLE DATA CACHE
# ============================================================

_data_cache = None
_cache_time = 0

# ============================================================
# YAHOO FINANCE SESSION
# ============================================================

yf_session = requests.Session(
    impersonate="chrome"
)

# ============================================================
# LOAD TRAINED MODEL
# ============================================================

def load_model():

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found: {MODEL_PATH}"
        )

    with open(MODEL_PATH, "rb") as file:
        model = pickle.load(file)

    return model


# ============================================================
# CLEAN DOWNLOADED DATA
# ============================================================

def clean_data(data):

    if data is None or data.empty:
        raise ValueError("No market data received from Yahoo Finance.")

    # yfinance can return MultiIndex columns
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    data = data.reset_index()

    if "Date" not in data.columns:
        raise ValueError("Date column missing from market data.")

    data["Date"] = pd.to_datetime(data["Date"])

    try:
        data["Date"] = data["Date"].dt.tz_localize(None)
    except TypeError:
        pass

    return data


# ============================================================
# DOWNLOAD STOCK + NIFTY DATA TOGETHER
# ============================================================

def download_market_data():

    global _data_cache
    global _cache_time

    # Use cache if still fresh
    if (
        _data_cache is not None
        and (time.time() - _cache_time) < CACHE_SECONDS
    ):
        print("Using cached market data...")
        return _data_cache

    print("Downloading stock and NIFTY data...")

    tickers = list(STOCK_SYMBOLS.values()) + ["^NSEI"]

    data = yf.download(
         tickers,
         period="2y",
         interval="1d",
         auto_adjust=False,
         progress=False,
         threads=False,
         timeout=20,
         session=yf_session
    )

    if data is None or data.empty:
        raise ValueError(
            "Yahoo Finance returned no market data."
        )

    _data_cache = data
    _cache_time = time.time()

    return data


# ============================================================
# GET INDIVIDUAL DATA FROM COMBINED DOWNLOAD
# ============================================================

def get_stock_data(symbol, market_data):

    ticker = STOCK_SYMBOLS[symbol]

    print(f"Preparing {symbol} data...")

    try:

        if isinstance(market_data.columns, pd.MultiIndex):

            data = market_data.xs(
                ticker,
                axis=1,
                level=1
            ).copy()

        else:
            data = market_data.copy()

    except Exception as error:

        raise ValueError(
            f"Unable to prepare {symbol} data: {error}"
        )

    return clean_data(data)


def get_nifty_data(market_data):

    print("Preparing NIFTY 50 data...")

    try:

        if isinstance(market_data.columns, pd.MultiIndex):

            data = market_data.xs(
                "^NSEI",
                axis=1,
                level=1
            ).copy()

        else:
            data = market_data.copy()

    except Exception as error:

        raise ValueError(
            f"Unable to prepare NIFTY data: {error}"
        )

    return clean_data(data)


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
    # 1. Download market data once
    # --------------------------------------------------------

    market_data = download_market_data()

    # --------------------------------------------------------
    # 2. Prepare stock data
    # --------------------------------------------------------

    stock_data = get_stock_data(
        symbol,
        market_data
    )

    # --------------------------------------------------------
    # 3. Prepare NIFTY data
    # --------------------------------------------------------

    nifty_data = get_nifty_data(
        market_data
    )

    # --------------------------------------------------------
    # 4. Create features
    # --------------------------------------------------------

    df = create_features(
        stock_data,
        nifty_data
    )

    # --------------------------------------------------------
    # 5. Check features
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
    # 6. Select the 37 features
    # --------------------------------------------------------

    feature_data = df[
        FEATURE_COLUMNS
    ].copy()

    feature_data = feature_data.replace(
        [float("inf"), float("-inf")],
        float("nan")
    )

    valid_rows = feature_data.dropna()

    if valid_rows.empty:
        raise ValueError(
            "No valid feature row available."
        )

    latest_features = valid_rows.iloc[[-1]]

    # --------------------------------------------------------
    # 7. Load model
    # --------------------------------------------------------

    model = load_model()

    # --------------------------------------------------------
    # 8. Make prediction
    # --------------------------------------------------------

    prediction = model.predict(
        latest_features
    )[0]

    # --------------------------------------------------------
    # 9. Get probabilities
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
    # 10. Convert prediction
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
        probability_map.get(
            int(prediction),
            0
        ) * 100
    )

    # --------------------------------------------------------
    # 11. Latest price
    # --------------------------------------------------------

    latest_row = df.iloc[-1]

    price = float(
        latest_row["Close"]
    )

    date = str(
        latest_row["Date"].date()
    )

    # --------------------------------------------------------
    # 12. Result
    # --------------------------------------------------------

    return {

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


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("==============================")
    print("STAGE 3 - LIVE PREDICTION")
    print("==============================")
    print()

    for symbol in STOCK_SYMBOLS:

        try:

            result = predict_stock(symbol)

            print()
            print("------------------------------")
            print("Stock:", result["symbol"])
            print("Price:", result["price"])
            print("Date:", result["date"])
            print("Prediction:", result["prediction"])
            print(
                "Confidence:",
                str(result["confidence"]) + "%"
            )
            print(
                "SELL:",
                str(result["probabilities"]["SELL"]) + "%"
            )
            print(
                "HOLD:",
                str(result["probabilities"]["HOLD"]) + "%"
            )
            print(
                "BUY:",
                str(result["probabilities"]["BUY"]) + "%"
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
