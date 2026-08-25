from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
import os

app = Flask(__name__)
CORS(app)

# =====================================================
# WEBSITE DIRECTORY
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# =====================================================
# SERVE MAIN WEBSITE
# =====================================================

@app.route("/")
def website():
    return send_from_directory(BASE_DIR, "index1.html")


# =====================================================
# SERVE CSS, JS AND OTHER FILES
# =====================================================

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


# =====================================================
# STOCK ANALYSIS DATA
# =====================================================

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


# =====================================================
# HEALTH CHECK
# =====================================================

@app.route("/health")
def health():

    return jsonify({
        "status": "online",
        "message": "AI Stock Market Analyser API is running"
    })


# =====================================================
# ANALYZE STOCK
# =====================================================

@app.route("/analyze", methods=["GET"])
def analyze():

    stock = request.args.get(
        "stock",
        ""
    ).strip().upper()

    if stock == "":

        return jsonify({
            "error": "Please provide a stock symbol"
        }), 400

    if stock not in stock_data:

        return jsonify({
            "error": "Stock not available"
        }), 404

    return jsonify(stock_data[stock])


# =====================================================
# REAL STOCK PRICE API
# =====================================================

@app.route("/price/<symbol>", methods=["GET"])
def get_price(symbol):

    try:

        symbol = symbol.strip().upper()

        # -------------------------------------------------
        # WEBSITE SYMBOL -> ACTUAL NSE SYMBOL
        # -------------------------------------------------

        ticker_map = {

            "RELIANCE": "RELIANCE.NS",

            "TCS": "TCS.NS",

            "INFY": "INFY.NS",

            # IMPORTANT:
            # HDFC Bank's NSE ticker is HDFCBANK
            "HDFC": "HDFCBANK.NS",

            "ITC": "ITC.NS"

        }

        # Get correct Yahoo Finance ticker
        yf_symbol = ticker_map.get(
            symbol,
            symbol + ".NS"
        )

        print(
            f"Fetching stock: {symbol} -> {yf_symbol}"
        )

        # -------------------------------------------------
        # FETCH REAL MARKET DATA
        # -------------------------------------------------

        ticker = yf.Ticker(yf_symbol)

        data = ticker.history(
            period="7d",
            interval="1d",
            auto_adjust=False
        )

        # -------------------------------------------------
        # EMPTY DATA
        # -------------------------------------------------

        if data.empty:

            return jsonify({

                "error":
                    f"No price data available for {symbol}",

                "symbol":
                    symbol,

                "yf_symbol":
                    yf_symbol

            }), 404

        # -------------------------------------------------
        # FORMAT DATA
        # -------------------------------------------------

        prices = []

        for date, row in data.iterrows():

            close_price = row.get("Close")

            if close_price is None:
                continue

            try:

                price = float(close_price)

            except (TypeError, ValueError):

                continue

            prices.append({

                "date":
                    date.strftime("%Y-%m-%d"),

                "price":
                    round(price, 2)

            })

        # -------------------------------------------------
        # NO VALID PRICES
        # -------------------------------------------------

        if not prices:

            return jsonify({

                "error":
                    f"No valid price data available for {symbol}",

                "symbol":
                    symbol,

                "yf_symbol":
                    yf_symbol

            }), 404

        # -------------------------------------------------
        # SUCCESS
        # -------------------------------------------------

        return jsonify({

            "symbol":
                symbol,

            "yf_symbol":
                yf_symbol,

            "prices":
                prices

        })

    except Exception as e:

        print(
            "PRICE API ERROR:",
            str(e)
        )

        return jsonify({

            "error":
                f"Unable to fetch stock price data for {symbol}",

            "details":
                str(e),

            "symbol":
                symbol

        }), 500


# =====================================================
# START FLASK SERVER
# =====================================================

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
