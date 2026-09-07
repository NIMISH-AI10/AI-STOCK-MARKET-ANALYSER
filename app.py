from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import yfinance as yf
import os

# Import trained ML prediction function
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
        "name": "Reliance Industries",
        "ticker": "RELIANCE.NS"
    },

    "TCS": {
        "name": "Tata Consultancy Services",
        "ticker": "TCS.NS"
    },

    "INFY": {
        "name": "Infosys",
        "ticker": "INFY.NS"
    },

    "HDFC": {
        "name": "HDFC Bank",
        "ticker": "HDFCBANK.NS"
    },

    "ITC": {
        "name": "ITC Limited",
        "ticker": "ITC.NS"
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

    if stock == "":
        return jsonify({
            "error": "Please provide a stock symbol"
        }), 400

    if stock not in stock_info:
        return jsonify({
            "error": "Stock not available"
        }), 404

    try:

        print(f"Running ML prediction for {stock}...")

        result = predict_stock(stock)

        result["name"] = stock_info[stock]["name"]

        return jsonify({

            "symbol": result["symbol"],

            "name": result["name"],

            "sentiment": get_sentiment(
                result["prediction"]
            ),

            "recommendation": result["prediction"],

            "confidence": round(
                result["confidence"],
                2
            ),

            "price": result["price"],

            "date": result["date"],

            "probabilities": result["probabilities"]

        })

    except Exception as e:

        print("ANALYSIS ERROR:", str(e))

        return jsonify({

            "error": f"Unable to analyse {stock}",

            "details": str(e),

            "symbol": stock

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
# LIVE STOCK PRICE
# =====================================================

@app.route("/price/<symbol>", methods=["GET"])
def get_price(symbol):

    symbol = symbol.strip().upper()

    if symbol not in stock_info:

        return jsonify({
            "error": "Stock not available",
            "symbol": symbol
        }), 404

    try:

        ticker_symbol = stock_info[symbol]["ticker"]

        print(
            f"Fetching live market data for {symbol}..."
        )

        ticker = yf.Ticker(ticker_symbol)

        # Get recent trading data
        history = ticker.history(
            period="5d",
            interval="1d"
        )

        if history.empty:

            return jsonify({
                "error": "No market data available",
                "symbol": symbol
            }), 500

        # Remove rows without closing price
        history = history.dropna(
            subset=["Close"]
        )

        if history.empty:

            return jsonify({
                "error": "No closing price available",
                "symbol": symbol
            }), 500

        latest = history.iloc[-1]

        current_price = float(
            latest["Close"]
        )

        # Previous trading day's close
        if len(history) >= 2:

            previous_price = float(
                history.iloc[-2]["Close"]
            )

        else:

            previous_price = current_price

        change = (
            current_price -
            previous_price
        )

        if previous_price != 0:

            change_percent = (
                change /
                previous_price
            ) * 100

        else:

            change_percent = 0

        # Historical data for chart
        prices = []

        for index, row in history.iterrows():

            prices.append({

                "date":
                    index.strftime("%Y-%m-%d"),

                "price":
                    round(
                        float(row["Close"]),
                        2
                    )

            })

        return jsonify({

            "symbol": symbol,

            "name":
                stock_info[symbol]["name"],

            "ticker":
                ticker_symbol,

            "price":
                round(
                    current_price,
                    2
                ),

            "previousClose":
                round(
                    previous_price,
                    2
                ),

            "change":
                round(
                    change,
                    2
                ),

            "changePercent":
                round(
                    change_percent,
                    2
                ),

            "prices":
                prices,

            "marketStatus":
                "LIVE DATA"

        })

    except Exception as e:

        print(
            "LIVE PRICE ERROR:",
            str(e)
        )

        return jsonify({

            "error":
                "Unable to fetch live market data",

            "details":
                str(e),

            "symbol":
                symbol

        }), 500


# =====================================================
# LIVE MARKET OVERVIEW
# =====================================================

@app.route("/market-data", methods=["GET"])
def market_data():

    market = []

    for symbol, info in stock_info.items():

        try:

            ticker = yf.Ticker(
                info["ticker"]
            )

            history = ticker.history(
                period="5d",
                interval="1d"
            )

            history = history.dropna(
                subset=["Close"]
            )

            if history.empty:
                continue

            current_price = float(
                history.iloc[-1]["Close"]
            )

            if len(history) >= 2:

                previous_price = float(
                    history.iloc[-2]["Close"]
                )

            else:

                previous_price = current_price

            change = (
                current_price -
                previous_price
            )

            if previous_price != 0:

                change_percent = (
                    change /
                    previous_price
                ) * 100

            else:

                change_percent = 0

            market.append({

                "symbol":
                    symbol,

                "name":
                    info["name"],

                "price":
                    round(
                        current_price,
                        2
                    ),

                "change":
                    round(
                        change,
                        2
                    ),

                "changePercent":
                    round(
                        change_percent,
                        2
                    ),

                "direction":
                    "up"
                    if change_percent > 0
                    else
                    "down"
                    if change_percent < 0
                    else
                    "flat"

            })

        except Exception as e:

            print(
                f"Market data error for {symbol}:",
                str(e)
            )

    return jsonify({

        "market":
            market,

        "count":
            len(market)

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
