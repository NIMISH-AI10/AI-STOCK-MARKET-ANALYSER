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
    return send_from_directory(BASE_DIR, "index1.html")


# ========================================
# SERVE CSS, JS AND OTHER FILES
# ========================================

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


# ========================================
# TEMPORARY DEMO STOCK DATA
# ML MODEL WILL BE CONNECTED HERE LATER
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

    stock = request.args.get("stock", "").strip().upper()

    if stock == "":
        return jsonify({
            "error": "Please provide a stock symbol"
        }), 400

    if stock not in stock_data:
        return jsonify({
            "error": "Stock not available"
        }), 404

    return jsonify(stock_data[stock])


# ========================================
# REAL STOCK PRICE API
# ========================================

@app.route("/price/<symbol>", methods=["GET"])
def get_price(symbol):

    try:

        symbol = symbol.strip().upper()

        ticker = yf.Ticker(symbol + ".NS")

        data = ticker.history(period="7d")

        if data.empty:
            return jsonify({
                "error": "Stock data not found"
            }), 404

        prices = []

        for date, row in data.iterrows():

            prices.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": round(float(row["Close"]), 2)
            })

        return jsonify({
            "symbol": symbol,
            "prices": prices
        })

    except Exception as e:

        return jsonify({
            "error": "Unable to fetch stock price data"
        }), 500


# ========================================
# START SERVER
# ========================================

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )