from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
import os

# Import the trained ML prediction function
from live_predict import predict_stock

app = Flask(__name__)
CORS(app)

# =====================================================
# WEBSITE DIRECTORY
# =====================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# =====================================================
# STOCK INFORMATION
# =====================================================

stock_info = {

    "RELIANCE": {
        "name": "Reliance Industries"
    },

    "TCS": {
        "name": "Tata Consultancy Services"
    },

    "INFY": {
        "name": "Infosys"
    },

    "HDFC": {
        "name": "HDFC Bank"
    },

    "ITC": {
        "name": "ITC Limited"
    }
}


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
# HEALTH CHECK
# =====================================================

@app.route("/health")
def health():

    return jsonify({
        "status": "online",
        "message": "AI Stock Market Analyser API is running"
    })


# =====================================================
# AI STOCK ANALYSIS
# =====================================================

@app.route("/analyze", methods=["GET"])
def analyze():

    stock = request.args.get(
        "stock",
        ""
    ).strip().upper()

    # -------------------------------------------------
    # CHECK STOCK SYMBOL
    # -------------------------------------------------

    if stock == "":

        return jsonify({
            "error": "Please provide a stock symbol"
        }), 400

    if stock not in stock_info:

        return jsonify({
            "error": "Stock not available"
        }), 404

    try:

        print(
            f"Running ML prediction for {stock}..."
        )

        # -------------------------------------------------
        # RUN TRAINED ML MODEL
        # -------------------------------------------------

        result = predict_stock(stock)

        # -------------------------------------------------
        # ADD COMPANY NAME
        # -------------------------------------------------

        result["name"] = stock_info[stock]["name"]

        # -------------------------------------------------
        # CONVERT MODEL OUTPUT INTO WEBSITE FORMAT
        # -------------------------------------------------

        return jsonify({

            "symbol":
                result["symbol"],

            "name":
                result["name"],

            "sentiment":
                get_sentiment(
                    result["prediction"]
                ),

            "recommendation":
                result["prediction"],

            "confidence":
                round(
                    result["confidence"],
                    2
                ),

            "price":
                result["price"],

            "date":
                result["date"],

            "probabilities":
                result["probabilities"]

        })

    except Exception as e:

        print(
            "ANALYSIS ERROR:",
            str(e)
        )

        return jsonify({

            "error":
                f"Unable to analyse {stock}",

            "details":
                str(e),

            "symbol":
                stock

        }), 500


# =====================================================
# SENTIMENT
# =====================================================

def get_sentiment(prediction):

    if prediction == "BUY":
        return "Positive"

    if prediction == "SELL":
        return "Negative"

    return "Neutral"


# =====================================================
# DIRECT ML PREDICTION API
# =====================================================

@app.route("/predict/<symbol>", methods=["GET"])
def predict(symbol):

    symbol = symbol.strip().upper()

    if symbol not in stock_info:

        return jsonify({
            "error": "Stock not available",
            "symbol": symbol
        }), 404

    try:

        print(
            f"Running direct ML prediction for {symbol}..."
        )

        result = predict_stock(symbol)

        result["name"] = stock_info[symbol]["name"]

        result["sentiment"] = get_sentiment(
            result["prediction"]
        )

        return jsonify(result)

    except Exception as e:

        print(
            "PREDICTION ERROR:",
            str(e)
        )

        return jsonify({

            "error":
                f"Unable to generate prediction for {symbol}",

            "details":
                str(e),

            "symbol":
                symbol

        }), 500


# =====================================================
# REAL STOCK PRICE API
# =====================================================
@app.route("/price/<symbol>", methods=["GET"])
def get_price(symbol):
    symbol = symbol.strip().upper()

    if symbol not in stock_info:
        return jsonify({
            "error": "Stock not available",
            "symbol": symbol
        }), 404

    return jsonify({
        "symbol": symbol,
        "prices": []
    })
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
