from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
import os

app = Flask(__name__)
CORS(app)


# ========================================
# SERVE WEBSITE
# ========================================

@app.route("/")
def website():

    return send_from_directory(
        os.path.dirname(os.path.abspath(__file__)),
        "index1.html"
    )


# ========================================
# SERVE CSS, JS AND OTHER FILES
# ========================================

@app.route("/<path:filename>")
def static_files(filename):

    return send_from_directory(
        os.path.dirname(os.path.abspath(__file__)),
        filename
    )


# ========================================
# TEMPORARY DEMO STOCK DATA
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
# ANALYZE STOCK API
# ========================================

@app.route("/analyze", methods=["GET"])
def analyze():

    stock = request.args.get("stock", "").upper()

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

        symbol = symbol.upper()

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

                "price": round(
                    float(row["Close"]),
                    2
                )

            })


        return jsonify({

            "symbol": symbol,

            "prices": prices

        })


    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 500


# ========================================
# START FLASK SERVER
# ========================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )