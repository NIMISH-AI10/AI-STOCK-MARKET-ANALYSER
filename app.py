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
# YAHOO FINANCE TICKER MAPPING
# =====================================================

ticker_symbols = {

    "RELIANCE": "RELIANCE.NS",

    "TCS": "TCS.NS",

    "INFY": "INFY.NS",

    # IMPORTANT HDFC FIX
    "HDFC": "HDFCBANK.NS",

    "ITC": "ITC.NS"
}


# =====================================================
# SERVE WEBSITE
# =====================================================

@app.route("/")
def website():

    return send_from_directory(
        BASE_DIR,
        "index1.html"
    )


# =====================================================
# SERVE CSS / JS / OTHER FILES
# =====================================================

@app.route("/<path:filename>")
def static_files(filename):

    return send_from_directory(
        BASE_DIR,
        filename
    )


# =====================================================
# HEALTH CHECK
# =====================================================

@app.route("/health")
def health():

    return jsonify({

        "status": "online",

        "message":
            "AI Stock Market Analyser API is running"

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


    # Empty input
    if not stock:

        return jsonify({

            "error":
                "Please provide a stock symbol"

        }), 400


    # Stock not supported
    if stock not in stock_data:

        return jsonify({

            "error":
                "Stock not available"

        }), 404


    # Return analysis
    return jsonify(
        stock_data[stock]
    )


# =====================================================
# REAL STOCK PRICE API
# =====================================================

@app.route("/price/<symbol>", methods=["GET"])
def get_price(symbol):

    try:

        # ---------------------------------------------
        # CLEAN SYMBOL
        # ---------------------------------------------

        symbol = symbol.strip().upper()


        # ---------------------------------------------
        # CHECK SUPPORTED STOCK
        # ---------------------------------------------

        if symbol not in ticker_symbols:

            return jsonify({

                "error":
                    f"Stock {symbol} is not supported"

            }), 404


        # ---------------------------------------------
        # GET YAHOO SYMBOL
        # ---------------------------------------------

        ticker_symbol = ticker_symbols[symbol]


        print(
            f"Fetching market data for {ticker_symbol}"
        )


        # ---------------------------------------------
        # CREATE YAHOO TICKER
        # ---------------------------------------------

        ticker = yf.Ticker(
            ticker_symbol
        )


        # ---------------------------------------------
        # GET 7 DAYS DATA
        # ---------------------------------------------

        data = ticker.history(

            period="7d",

            interval="1d",

            auto_adjust=False

        )


        # ---------------------------------------------
        # CHECK DATA
        # ---------------------------------------------

        if data is None or data.empty:

            print(
                f"No market data for {ticker_symbol}"
            )

            return jsonify({

                "error":
                    f"No price data found for {symbol}"

            }), 404


        # ---------------------------------------------
        # BUILD PRICE LIST
        # ---------------------------------------------

        prices = []


        for date, row in data.iterrows():

            close_price = row.get("Close")


            if close_price is None:

                continue


            try:

                close_price = float(
                    close_price
                )

            except (
                TypeError,
                ValueError
            ):

                continue


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


        # ---------------------------------------------
        # CHECK VALID PRICES
        # ---------------------------------------------

        if not prices:

            return jsonify({

                "error":
                    f"No valid price data found for {symbol}"

            }), 404


        # ---------------------------------------------
        # CURRENT PRICE
        # ---------------------------------------------

        current_price = prices[-1]["price"]


        # ---------------------------------------------
        # PREVIOUS PRICE
        # ---------------------------------------------

        previous_price = None

        if len(prices) >= 2:

            previous_price = prices[-2]["price"]


        # ---------------------------------------------
        # DAILY CHANGE
        # ---------------------------------------------

        change = None

        change_percent = None


        if previous_price is not None:

            change = round(
                current_price - previous_price,
                2
            )


            if previous_price != 0:

                change_percent = round(

                    (
                        change /
                        previous_price
                    ) * 100,

                    2

                )


        # ---------------------------------------------
        # RESPONSE
        # ---------------------------------------------

        response = {

            "symbol": symbol,

            "company":
                stock_data.get(
                    symbol,
                    {}
                ).get(
                    "name",
                    symbol
                ),

            "ticker":
                ticker_symbol,

            "current_price":
                current_price,

            "previous_price":
                previous_price,

            "change":
                change,

            "change_percent":
                change_percent,

            "prices":
                prices

        }


        print(
            f"{symbol} market data loaded successfully"
        )


        return jsonify(response)


    # ---------------------------------------------
    # ERROR HANDLING
    # ---------------------------------------------

    except Exception as e:

        print(
            f"PRICE ERROR for {symbol}: "
            f"{repr(e)}"
        )


        return jsonify({

            "error":
                f"Unable to fetch stock price data for {symbol}"

        }), 500


# =====================================================
# START SERVER
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
