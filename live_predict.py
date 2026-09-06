import os
import pickle
import time

import pandas as pd
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
# CACHE
# ============================================================

_data_cache = None
_cache_time = 0


# ============================================================
# YAHOO SESSION
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
# DOWNLOAD ONE SYMBOL DIRECTLY FROM YAHOO CHART API
# ============================================================

def download_symbol(symbol):

    print(f"Downloading {symbol}...")

    url = (
        "https://query1.finance.yahoo.com/"
        f"v8/finance/chart/{symbol}"
    )

    params = {
        "range": "2y",
        "interval": "1d",
        "events": "history"
    }

    response = yf_session.get(
        url,
        params=params,
        timeout=30
    )

    if response.status_code != 200:

        raise ValueError(
            f"Yahoo Finance returned HTTP "
            f"{response.status_code} for {symbol}"
        )

    data = response.json()

    chart = data.get("chart", {})
    result = chart.get("result")

    if not result:

        error = chart.get("error")

        if error:
            raise ValueError(
                error.get(
                    "description",
                    f"No data returned for {symbol}"
                )
            )

        raise ValueError(
            f"No market data returned for {symbol}"
        )

    result = result[0]

    timestamps = result.get("timestamp")
    indicators = result.get("indicators", {})
    quotes = indicators.get("quote")

    if not timestamps or not quotes:

        raise ValueError(
            f"Invalid market data returned for {symbol}"
        )

    quote = quotes[0]

    data = pd.DataFrame({
        "Date": pd.to_datetime(
            timestamps,
            unit="s"
        ),
        "Open": quote.get("open"),
        "High": quote.get("high"),
        "Low": quote.get("low"),
        "Close": quote.get("close"),
        "Volume": quote.get("volume")
    })

    data = data.dropna(
        subset=[
            "Open",
            "High",
            "Low",
            "Close"
        ]
    )

    if data.empty:

        raise ValueError(
            f"No valid market data for {symbol}"
        )

    data["Date"] = pd.to_datetime(
        data["Date"]
    )

    try:

        data["Date"] = (
            data["Date"]
            .dt
            .tz_localize(None)
        )

    except TypeError:
        pass

    return data


# ============================================================
# DOWNLOAD STOCK + NIFTY DATA
# ============================================================

def download_market_data():

    global _data_cache
    global _cache_time

    # Use cache if still fresh
    if (
        _data_cache is not None
        and (time.time() - _cache_time)
        < CACHE_SECONDS
    ):

        print("Using cached market data...")

        return _data_cache

    print(
        "Downloading stock and NIFTY data..."
    )

    market_data = {}

    # Download stocks
    for symbol, ticker in STOCK_SYMBOLS.items():

        market_data[ticker] = (
            download_symbol(ticker)
        )

    # Download NIFTY
    market_data["^NSEI"] = (
        download_symbol("^NSEI")
    )

    _data_cache = market_data
    _cache_time = time.time()

    return market_data


# ============================================================
# GET INDIVIDUAL STOCK DATA
# ============================================================

def get_stock_data(symbol, market_data):

    ticker = STOCK_SYMBOLS[symbol]

    print(
        f"Preparing {symbol} data..."
    )

    if ticker not in market_data:

        raise ValueError(
            f"Data not available for {symbol}"
        )

    return market_data[ticker].copy()


# ============================================================
# GET NIFTY DATA
# ============================================================

def get_nifty_data(market_data):

    print(
        "Preparing NIFTY 50 data..."
    )

    if "^NSEI" not in market_data:

        raise ValueError(
            "NIFTY data not available."
        )

    return market_data["^NSEI"].copy()


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
    # 1. Download market data
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
