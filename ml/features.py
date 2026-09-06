import pandas as pd
import numpy as np

from ta.momentum import RSIIndicator
from ta.trend import (
    MACD,
    SMAIndicator,
    EMAIndicator,
    ADXIndicator
)
from ta.volatility import (
    BollingerBands,
    AverageTrueRange
)


def create_features(stock_data, nifty_data=None):

    df = stock_data.copy()

    df = df.sort_values("Date").reset_index(drop=True)

    # Make sure numeric columns are numbers
    numeric_columns = [
        "Open",
        "High",
        "Low",
        "Close",
        "Volume"
    ]

    for column in numeric_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    # ========================================================
    # RETURNS
    # ========================================================

    df["Return_1D"] = df["Close"].pct_change()

    df["Return_5D"] = df["Close"].pct_change(5)

    df["Return_20D"] = df["Close"].pct_change(20)

    # ========================================================
    # MOVING AVERAGES
    # ========================================================

    df["SMA_10"] = SMAIndicator(
        close=df["Close"],
        window=10
    ).sma_indicator()

    df["SMA_20"] = SMAIndicator(
        close=df["Close"],
        window=20
    ).sma_indicator()

    df["SMA_50"] = SMAIndicator(
        close=df["Close"],
        window=50
    ).sma_indicator()

    df["SMA_200"] = SMAIndicator(
        close=df["Close"],
        window=200
    ).sma_indicator()

    # ========================================================
    # EMA
    # ========================================================

    df["EMA_12"] = EMAIndicator(
        close=df["Close"],
        window=12
    ).ema_indicator()

    df["EMA_26"] = EMAIndicator(
        close=df["Close"],
        window=26
    ).ema_indicator()

    # ========================================================
    # RSI
    # ========================================================

    df["RSI"] = RSIIndicator(
        close=df["Close"],
        window=14
    ).rsi()

    # ========================================================
    # MACD
    # ========================================================

    macd = MACD(
        close=df["Close"],
        window_slow=26,
        window_fast=12,
        window_sign=9
    )

    df["MACD"] = macd.macd()

    df["MACD_Signal"] = macd.macd_signal()

    df["MACD_Histogram"] = macd.macd_diff()

    # ========================================================
    # BOLLINGER BANDS
    # ========================================================

    bollinger = BollingerBands(
        close=df["Close"],
        window=20,
        window_dev=2
    )

    df["BB_High"] = bollinger.bollinger_hband()

    df["BB_Low"] = bollinger.bollinger_lband()

    df["BB_Middle"] = bollinger.bollinger_mavg()

    df["BB_Width"] = bollinger.bollinger_wband()

    # ========================================================
    # ATR
    # ========================================================

    df["ATR"] = AverageTrueRange(
        high=df["High"],
        low=df["Low"],
        close=df["Close"],
        window=14
    ).average_true_range()

    # ========================================================
    # ADX
    # ========================================================

    adx = ADXIndicator(
        high=df["High"],
        low=df["Low"],
        close=df["Close"],
        window=14
    )

    df["ADX"] = adx.adx()

    # ========================================================
    # VOLUME
    # ========================================================

    df["Volume_Change"] = df["Volume"].pct_change()

    df["Volume_SMA_20"] = (
        df["Volume"]
        .rolling(20)
        .mean()
    )

    df["Volume_Ratio"] = (
        df["Volume"]
        / df["Volume_SMA_20"]
    )

    # ========================================================
    # VOLATILITY
    # ========================================================

    df["Volatility_20D"] = (
        df["Return_1D"]
        .rolling(20)
        .std()
    )

    # ========================================================
    # PRICE VS MOVING AVERAGES
    # ========================================================

    df["Price_vs_SMA20"] = (
        df["Close"] / df["SMA_20"] - 1
    )

    df["Price_vs_SMA50"] = (
        df["Close"] / df["SMA_50"] - 1
    )

    df["Price_vs_SMA200"] = (
        df["Close"] / df["SMA_200"] - 1
    )

    # ========================================================
    # DAILY RANGE
    # ========================================================

    df["Daily_Range"] = (
        (df["High"] - df["Low"])
        / df["Close"]
    )

    # ========================================================
    # NIFTY 50 FEATURES
    # ========================================================

    if nifty_data is not None:

        nifty = nifty_data.copy()

        nifty = nifty[
            ["Date", "Close"]
        ].copy()

        nifty = nifty.rename(
            columns={
                "Close": "NIFTY_Close"
            }
        )

        nifty["NIFTY_Return_1D"] = (
            nifty["NIFTY_Close"]
            .pct_change()
        )

        nifty["NIFTY_Return_5D"] = (
            nifty["NIFTY_Close"]
            .pct_change(5)
        )

        nifty["NIFTY_SMA20"] = (
            nifty["NIFTY_Close"]
            .rolling(20)
            .mean()
        )

        nifty["NIFTY_Trend"] = (
            nifty["NIFTY_Close"]
            / nifty["NIFTY_SMA20"]
            - 1
        )

        df = pd.merge(
            df,
            nifty,
            on="Date",
            how="left"
        )

    # ========================================================
# ========================================================
    # FUTURE PRICE
    # ========================================================

    df["Future_Close_5D"] = (
        df["Close"].shift(-5)
    )

    df["Future_Return_5D"] = (
        df["Future_Close_5D"]
        / df["Close"]
        - 1
    )

    # DO NOT CREATE Target HERE.
    # train_data.py creates the 3-class target.

    # ========================================================
    # CLEAN DATA
    # ========================================================

    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    return df 
    
