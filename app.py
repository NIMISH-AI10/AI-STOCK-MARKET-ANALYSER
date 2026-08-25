from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
import os

app = Flask(__name__)
CORS(app)

# ========================================
# WEBSITE DIRECTORY
# ========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ========================================
# SERVE WEBSITE
# ========================================

@app.route("/")
def website():
    return send_from_directory(
        BASE_DIR,
        "index1.html"
    )


# ========================================
# SERVE CSS, JS AND OTHER FILES
# ========================================

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(
        BASE_DIR,
        filename
    )


# ========================================
# STOCK ANALYSIS DATA
# ========================================

stock_data = {

    "RELIANCE": {
        "name": "Reliance Industries",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 86
    },

    "TCS": {
        "name": "Tata Consultancy Services",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 79
    },

    "INFY": {
        "name": "Infosys",
        "sentiment": "Neutral",
        "recommendation": "HOLD",
        "confidence": 68
    },

    "HDFC": {
        "name": "HDFC Bank",
        "sentiment": "Positive",
        "recommendation": "BUY",
        "confidence": 82
    },

    "ITC": {
        "name": "ITC Limited",
        "sentiment": "Negative",
        "recommendation": "SELL",
        "confidence": 71
    }
}


# ========================================
# HEALTH CHECK
# ========================================

@app.route("/health")
def health():

    return jsonify({
        "status": "online",
        "message": "AI Stock Market Analyser API is running"
    })


# ========================================
# ANALYZE STOCK
# ========================================

@app.route("/analyze", methods=["GET"])
def analyze():

    stock = request.args.get(
        "stock",
        ""
    ).strip().upper()

    # Empty stock
    if stock == "":

        return jsonify({
            "error": "Please provide a stock symbol"
        }), 400

    # Unsupported stock
    if stock not in stock_data:

        return jsonify({
            "error": "Stock not available"
        }), 404

    # Return stock analysis
    return jsonify(
        stock_data[stock]
    )


# ========================================
# REAL STOCK PRICE API
# ========================================

@app.route("/price/<symbol>", methods=["GET"])
def get_price(symbol):

    try:

        # ------------------------------------
        # CLEAN SYMBOL
        # ------------------------------------

        symbol = symbol.strip().upper()


        # ------------------------------------
        # YAHOO FINANCE SYMBOL MAPPING
        # ------------------------------------

        ticker_symbols = {

            "RELIANCE": "RELIANCE.NS",

            "TCS": "TCS.NS",

            "INFY": "INFY.NS",

            # IMPORTANT:
            # HDFC Bank Yahoo ticker
            "HDFC": "HDFCBANK.NS",

            "ITC": "ITC.NS"
        }


        # Use mapped ticker
        ticker_symbol = ticker_symbols.get(
            symbol,
            symbol + ".NS"
        )


        print(
            f"Fetching price data for {ticker_symbol}"
        )


        # ------------------------------------
        # YFINANCE
        # ------------------------------------

        ticker = yf.Ticker(
            ticker_symbol
        )


        # ------------------------------------
        # GET LAST 7 DAYS
        # ------------------------------------

        data = ticker.history(
            period="7d",
            interval="1d",
            auto_adjust=False
        )


        # ------------------------------------
        # CHECK DATA
        # ------------------------------------

        if data is None or data.empty:

            print(
                f"No data returned for {ticker_symbol}"
            )

            return jsonify({
                "error":
                    f"No price data found for {symbol}"
            }), 404


        # ------------------------------------
        # CREATE PRICE LIST
        # ------------------------------------

        prices = []


        for date, row in data.iterrows():

            close_price = row.get(
                "Close"
            )


            # Skip missing price

            if close_price is None:
                continue


            # Convert to float

            try:

                close_price = float(
                    close_price
                )

            except (
                TypeError,
                ValueError
            ):

                continue


            # Add price

            prices.append({

                "date":
                    date.strftime(
                        "%Y-%m-%d"
                    ),

                "price":
                    round(
                        close_price,
                        2
                    )
            })


        # ------------------------------------
        # CHECK VALID PRICE DATA
        # ------------------------------------

        if not prices:

            return jsonify({
                "error":
                    f"No valid price data found for {symbol}"
            }), 404


        # ------------------------------------
        # SUCCESS
        # ------------------------------------

        print(
            f"Successfully loaded {symbol}"
        )

        print(
            f"Yahoo ticker: {ticker_symbol}"
        )

        print(
            f"Number of prices: {len(prices)}"
        )


        return jsonify({

            "symbol": symbol,

            "prices": prices

        })


    # ========================================
    # ERROR
    # ========================================

    except Exception as e:

        print(
            f"PRICE ERROR for {symbol}: "
            f"{repr(e)}"
        )


        return jsonify({

            "error":
                f"Unable to fetch stock price data for {symbol}"

        }), 500


# ========================================
# START SERVER
# ========================================

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
