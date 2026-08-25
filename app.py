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
# STOCK DATA
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
# ANALYZE STOCK API
# ========================================

@app.route("/analyze", methods=["GET"])
def analyze():

    stock = request.args.get(
        "stock",
        ""
    ).strip().upper()


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
        # NSE SYMBOL
        # ------------------------------------

        ticker_symbol = symbol + ".NS"


        print(
            f"Fetching price data for {ticker_symbol}"
        )


        # ------------------------------------
        # CREATE YFINANCE TICKER
        # ------------------------------------

        ticker = yf.Ticker(
            ticker_symbol
        )


        # ------------------------------------
        # GET 7 DAYS DATA
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


            # Skip missing values

            if close_price is None:

                continue


            # Convert price to float

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
        # CHECK VALID PRICES
        # ------------------------------------

        if not prices:

            return jsonify({
                "error":
                    f"No valid price data found for {symbol}"
            }), 404


        # ------------------------------------
        # RETURN DATA
        # ------------------------------------

        print(
            f"Successfully loaded {symbol}: "
            f"{len(prices)} prices"
        )


        return jsonify({

            "symbol": symbol,

            "prices": prices

        })


    # ========================================
    # ERROR HANDLING
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
