import os
import pandas as pd
import yfinance as yf


# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data"
)

RAW_DIR = os.path.join(DATA_DIR, "raw")

os.makedirs(RAW_DIR, exist_ok=True)


# ============================================================
# STOCK SYMBOLS
# ============================================================

STOCKS = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "HDFC": "HDFCBANK.NS",
    "ITC": "ITC.NS",

    # Additional major NSE stocks
    "ICICIBANK": "ICICIBANK.NS",
    "SBIN": "SBIN.NS",
    "BHARTIARTL": "BHARTIARTL.NS",
    "LT": "LT.NS",
    "HINDUNILVR": "HINDUNILVR.NS",
    "KOTAKBANK": "KOTAKBANK.NS",
    "AXISBANK": "AXISBANK.NS",
    "MARUTI": "MARUTI.NS",
    "SUNPHARMA": "SUNPHARMA.NS",
    "TITAN": "TITAN.NS",
    "ADANIENT": "ADANIENT.NS",
    "BAJFINANCE": "BAJFINANCE.NS",
    "ASIANPAINT": "ASIANPAINT.NS",
    "WIPRO": "WIPRO.NS",
    "HCLTECH": "HCLTECH.NS"
}


# ============================================================
# NIFTY 50
# ============================================================

NIFTY_SYMBOL = "^NSEI"


# ============================================================
# DOWNLOAD ONE STOCK
# ============================================================

def download_stock(symbol, yf_symbol, period="10y"):

    print()
    print("=" * 60)
    print(f"Downloading {symbol}")
    print(f"Yahoo symbol: {yf_symbol}")
    print("=" * 60)

    try:

        data = yf.download(
            yf_symbol,
            period=period,
            interval="1d",
            auto_adjust=False,
            progress=False,
            threads=False
        )

        if data.empty:
            print(f"WARNING: No data received for {symbol}")
            return None

        # ----------------------------------------------------
        # Handle yfinance MultiIndex columns
        # ----------------------------------------------------

        if isinstance(data.columns, pd.MultiIndex):

            data.columns = [
                column[0]
                for column in data.columns
            ]

        # ----------------------------------------------------
        # Reset index
        # ----------------------------------------------------

        data = data.reset_index()

        # ----------------------------------------------------
        # Keep required columns
        # ----------------------------------------------------

        required_columns = [
            "Date",
            "Open",
            "High",
            "Low",
            "Close",
            "Volume"
        ]

        available_columns = [
            column
            for column in required_columns
            if column in data.columns
        ]

        data = data[available_columns].copy()

        # ----------------------------------------------------
        # Add stock symbol
        # ----------------------------------------------------

        data["Symbol"] = symbol

        # ----------------------------------------------------
        # Clean data
        # ----------------------------------------------------

        data = data.dropna()

        data = data.sort_values("Date")

        # ----------------------------------------------------
        # Save
        # ----------------------------------------------------

        output_file = os.path.join(
            RAW_DIR,
            f"{symbol}.csv"
        )

        data.to_csv(
            output_file,
            index=False
        )

        print(
            f"Saved {len(data):,} rows to {output_file}"
        )

        print(
            f"From: {data['Date'].min()}"
        )

        print(
            f"To:   {data['Date'].max()}"
        )

        return data

    except Exception as e:

        print(
            f"ERROR downloading {symbol}: {e}"
        )

        return None


# ============================================================
# DOWNLOAD NIFTY 50
# ============================================================

def download_nifty(period="10y"):

    print()
    print("=" * 60)
    print("Downloading NIFTY 50")
    print("=" * 60)

    try:

        data = yf.download(
            NIFTY_SYMBOL,
            period=period,
            interval="1d",
            auto_adjust=False,
            progress=False,
            threads=False
        )

        if data.empty:
            print("WARNING: No NIFTY data received")
            return None

        if isinstance(data.columns, pd.MultiIndex):

            data.columns = [
                column[0]
                for column in data.columns
            ]

        data = data.reset_index()

        required_columns = [
            "Date",
            "Open",
            "High",
            "Low",
            "Close",
            "Volume"
        ]

        available_columns = [
            column
            for column in required_columns
            if column in data.columns
        ]

        data = data[available_columns].copy()

        data = data.dropna()

        data = data.sort_values("Date")

        output_file = os.path.join(
            RAW_DIR,
            "NIFTY50.csv"
        )

        data.to_csv(
            output_file,
            index=False
        )

        print(
            f"Saved {len(data):,} NIFTY rows"
        )

        return data

    except Exception as e:

        print(
            f"ERROR downloading NIFTY: {e}"
        )

        return None


# ============================================================
# DOWNLOAD EVERYTHING
# ============================================================

def download_all(period="10y"):

    print()
    print("#" * 60)
    print("STOCK MARKET DATA DOWNLOAD")
    print("#" * 60)

    results = {}

    # --------------------------------------------------------
    # Stocks
    # --------------------------------------------------------

    for symbol, yf_symbol in STOCKS.items():

        data = download_stock(
            symbol,
            yf_symbol,
            period
        )

        if data is not None:
            results[symbol] = data

    # --------------------------------------------------------
    # NIFTY
    # --------------------------------------------------------

    nifty = download_nifty(period)

    if nifty is not None:
        results["NIFTY50"] = nifty

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print()
    print("#" * 60)
    print("DOWNLOAD COMPLETE")
    print("#" * 60)

    print(
        f"Successful datasets: {len(results)}"
    )

    print(
        f"Raw data directory: {RAW_DIR}"
    )

    return results


# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    download_all(
        period="10y"
    )
