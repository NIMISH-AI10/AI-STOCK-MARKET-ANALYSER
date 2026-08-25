from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import yfinance as yf
import os

app = Flask(__name__)
CORS(app)

# ============================================================
# WEBSITE DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


@app.route("/")
def website():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


# ============================================================
# STOCK DATA
# ============================================================

stock_data = {

    "TCS": {
        "company": "Tata Consultancy Services",
        "sector": "Information Technology",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 82,
        "summary": "TCS shows a positive market outlook based on its strong business performance and IT sector position."
    },

    "ITC": {
        "company": "ITC Limited",
        "sector": "FMCG",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 78,
        "summary": "ITC has a stable business profile with diversified operations and a positive long-term outlook."
    },

    "HDFC": {
        "company": "HDFC Bank",
        "sector": "Banking",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 80,
        "summary": "HDFC Bank has a strong banking position and generally positive long-term market prospects."
    },

    "HDFCBANK": {
        "company": "HDFC Bank",
        "sector": "Banking",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 80,
        "summary": "HDFC Bank has a strong banking position and generally positive long-term market prospects."
    },

    "RELIANCE": {
        "company": "Reliance Industries",
        "sector": "Conglomerate",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 81,
        "summary": "Reliance has diversified businesses across energy, telecom and retail with a positive outlook."
    },

    "INFY": {
        "company": "Infosys Limited",
        "sector": "Information Technology",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 79,
        "summary": "Infosys remains a major IT services company with a positive long-term outlook."
    },

    "WIPRO": {
        "company": "Wipro Limited",
        "sector": "Information Technology",
        "sentiment": "Neutral",
        "recommendation": "HOLD",
        "confidence": 70,
        "summary": "Wipro has a stable business position, but current market conditions suggest a cautious outlook."
    }
}


# ============================================================
# STOCK SYMBOL MAP
# ============================================================

# IMPORTANT:
# HDFC Ltd. merged with HDFC Bank.
# Yahoo Finance uses HDFCBANK.NS for HDFC Bank.

ticker_map = {
    "HDFC": "HDFCBANK.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "TCS": "TCS.NS",
    "ITC": "ITC.NS",
    "RELIANCE": "RELIANCE.NS",
    "INFY": "INFY.NS",
    "WIPRO": "WIPRO.NS"
}


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():

    return jsonify({
        "status": "online",
        "message": "AI Stock Market Analyser API is running"
    })


# ============================================================
# ANALYZE STOCK
# ============================================================

@app.route("/analyze", methods=["GET"])
def analyze():

    stock = request.args.get("stock", "").strip().upper()

    # Empty input
    if stock == "":
        return jsonify({
            "error": "Please provide a stock symbol"
        }), 400

    # Check supported stock
    if stock not in stock_data:

        return jsonify({
            "error": "Stock not available"
        }), 404

    # Return analysis
    return jsonify(
        stock_data[stock]
    )


# ============================================================
# GET STOCK PRICE
# ============================================================

@app.route("/price/<symbol>", methods=["GET"])
def get_price(symbol):

    try:

        # ----------------------------------------------------
        # CLEAN SYMBOL
        # ----------------------------------------------------

        symbol = symbol.strip().upper()


        # ----------------------------------------------------
        # GET YAHOO FINANCE SYMBOL
        # ----------------------------------------------------

        ticker_symbol = ticker_map.get(
            symbol,
            symbol + ".NS"
        )

        print(
            f"Fetching price data for {ticker_symbol}"
        )


        # ----------------------------------------------------
        # CREATE YFINANCE TICKER
        # ----------------------------------------------------

        ticker = yf.Ticker(ticker_symbol)


        # ----------------------------------------------------
        # GET 7 DAYS DATA
        # ----------------------------------------------------

        data = ticker.history(
            period="7d",
            interval="1d"
        )


        # ----------------------------------------------------
        # CHECK DATA
        # ----------------------------------------------------

        if data.empty:

            return jsonify({
                "error": f"No price data found for {symbol}"
            }), 404


        # ----------------------------------------------------
        # CREATE PRICE LIST
        # ----------------------------------------------------

        prices = []


        for date, row in data.iterrows():

            close_price = row.get("Close")


            # Skip missing values
            if close_price is None:
                continue


            # Convert price to float
            try:

                close_price = float(close_price)

            except (TypeError, ValueError):

                continue


            # Add price
            prices.append({

                "date": date.strftime("%Y-%m-%d"),

                "price": round(
                    close_price,
                    2
                )

            })


        # ----------------------------------------------------
        # CHECK VALID PRICES
        # ----------------------------------------------------

        if not prices:

            return jsonify({
                "error": f"No valid price data found for {symbol}"
            }), 404


        # ----------------------------------------------------
        # RETURN DATA
        # ----------------------------------------------------

        print(
            f"Successfully loaded {symbol}: "
            f"{len(prices)} prices"
        )


        return jsonify({

            "symbol": symbol,

            "prices": prices

        })


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as e:

        print(
            f"PRICE ERROR for {symbol}: {repr(e)}"
        )

        return jsonify({

            "error":
                f"Unable to fetch stock price data for {symbol}",

            "details":
                str(e)

        }), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
