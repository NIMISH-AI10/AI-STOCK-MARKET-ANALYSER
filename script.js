// =====================================================
// AI STOCK MARKET ANALYSER
// FRONTEND JAVASCRIPT
// =====================================================


// ================= GLOBAL VARIABLES =================

let stockChart = null;


// ================= STOCK INPUT =================

const stockInput = document.getElementById("stockInput");
const result = document.getElementById("result");
const analyzeBtn = document.getElementById("analyzeBtn");


// =====================================================
// ANALYZE STOCK
// =====================================================

async function analyzeStock() {

    const stock = stockInput.value.trim().toUpperCase();


    // ---------- EMPTY INPUT ----------

    if (stock === "") {

        result.innerHTML = `
            <div class="analysis-result">

                <h3>⚠ INPUT REQUIRED</h3>

                <h2>Please enter a stock symbol</h2>

                <p>
                    Example:
                    <strong>RELIANCE</strong>,
                    <strong>TCS</strong>,
                    <strong>INFY</strong>
                </p>

            </div>
        `;

        return;
    }


    // ---------- LOADING ----------

    result.innerHTML = `
        <div class="analysis-result">

            <h3>🤖 AI ANALYSIS</h3>

            <h2>Analyzing ${stock}...</h2>

            <p>
                Connecting to the Flask backend
                and processing stock information.
            </p>

        </div>
    `;


    // Disable button while loading

    if (analyzeBtn) {

        analyzeBtn.disabled = true;

        analyzeBtn.innerHTML = `
            ANALYZING...
        `;
    }


    try {

        // =================================================
        // CALL FLASK ANALYZE API
        // =================================================

        const response = await fetch(
            `/analyze?stock=${encodeURIComponent(stock)}`
        );


        const data = await response.json();


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            result.innerHTML = `
                <div class="analysis-result">

                    <h3>⚠ ANALYSIS ERROR</h3>

                    <h2>
                        ${data.error || "Stock not available"}
                    </h2>

                    <p>
                        Please try one of the supported stocks.
                    </p>

                </div>
            `;

            return;
        }


        // =================================================
        // RECOMMENDATION CLASS
        // =================================================

        let recommendationClass = "hold";

        let recommendationIcon = "⏸️";


        if (data.recommendation === "BUY") {

            recommendationClass = "buy";

            recommendationIcon = "📈";

        }

        else if (data.recommendation === "SELL") {

            recommendationClass = "sell";

            recommendationIcon = "📉";

        }

        else {

            recommendationClass = "hold";

            recommendationIcon = "⏸️";

        }


        // =================================================
        // SENTIMENT ICON
        // =================================================

        let sentimentIcon = "😐";


        if (
            data.sentiment &&
            data.sentiment.toLowerCase() === "positive"
        ) {

            sentimentIcon = "😊";

        }

        else if (
            data.sentiment &&
            data.sentiment.toLowerCase() === "negative"
        ) {

            sentimentIcon = "😟";

        }


        // =================================================
        // DISPLAY RESULT
        // =================================================

        result.innerHTML = `

            <div class="analysis-result">

                <h3>
                    🤖 AI ANALYSIS COMPLETE
                </h3>


                <h2>
                    ${data.name || stock}
                </h2>


                <p>

                    Stock Symbol:

                    <strong>
                        ${stock}
                    </strong>

                </p>


                <div class="analysis-details">


                    <!-- SENTIMENT -->

                    <div>

                        <span>
                            Market Sentiment
                        </span>

                        <strong>
                            ${sentimentIcon}
                            ${data.sentiment || "N/A"}
                        </strong>

                    </div>


                    <!-- RECOMMENDATION -->

                    <div>

                        <span>
                            Recommendation
                        </span>

                        <strong class="${recommendationClass}">

                            ${recommendationIcon}

                            ${data.recommendation || "N/A"}

                        </strong>

                    </div>


                    <!-- CONFIDENCE -->

                    <div>

                        <span>
                            Confidence Score
                        </span>

                        <strong>
                            ${data.confidence ?? "N/A"}%
                        </strong>

                    </div>


                </div>


                <!-- ANALYSIS STATUS -->

                <p style="
                    margin-top:20px;
                    color:#7d8fa4;
                    font-size:0.75rem;
                ">

                    ✓ Analysis received successfully
                    from Flask backend.

                </p>

            </div>

        `;


        // =================================================
        // UPDATE STOCK CHART
        // =================================================

        await updateStockChart(stock);

    }


    // =================================================
    // CONNECTION ERROR
    // =================================================

    catch (error) {

        console.error(
            "Backend connection error:",
            error
        );


        result.innerHTML = `

            <div class="analysis-result">

                <h3>
                    ❌ CONNECTION ERROR
                </h3>

                <h2>
                    Cannot connect to Flask backend
                </h2>

                <p>

                    Make sure your Flask server is running:

                </p>

                <strong>
                    python app.py
                </strong>

            </div>

        `;

    }


    // =================================================
    // ENABLE BUTTON AGAIN
    // =================================================

    finally {

        if (analyzeBtn) {

            analyzeBtn.disabled = false;

            analyzeBtn.innerHTML = `
                ANALYZE
                <span>→</span>
            `;

        }

    }

}



// =====================================================
// UPDATE STOCK CHART
// =====================================================

async function updateStockChart(stock) {


    const canvas =
        document.getElementById("stockChart");


    // ---------- CHECK CANVAS ----------

    if (!canvas) {

        console.error(
            "Stock chart canvas not found."
        );

        return;
    }


    try {


        // =================================================
        // CALL FLASK PRICE API
        // =================================================

        const response = await fetch(
            `/price/${encodeURIComponent(stock)}`
        );


        const data = await response.json();


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            console.error(
                data.error ||
                "Unable to load stock price."
            );

            return;
        }


        // =================================================
        // CHECK DATA
        // =================================================

        if (
            !data.prices ||
            data.prices.length === 0
        ) {

            console.error(
                "No price data available."
            );

            return;
        }


        // =================================================
        // CREATE LABELS
        // =================================================

        const labels = data.prices.map(
            item => item.date
        );


        // =================================================
        // CREATE PRICE DATA
        // =================================================

        const prices = data.prices.map(
            item => item.price
        );


        // =================================================
        // DESTROY OLD CHART
        // =================================================

        if (stockChart !== null) {

            stockChart.destroy();

            stockChart = null;
        }


        // =================================================
        // CREATE NEW CHART
        // =================================================

        stockChart = new Chart(
            canvas,
            {

                type: "line",


                data: {

                    labels: labels,


                    datasets: [

                        {

                            label:
                                `${stock} Price`,


                            data: prices,


                            borderWidth: 3,


                            tension: 0.35,


                            fill: true,


                            pointRadius: 4,


                            pointHoverRadius: 7

                        }

                    ]

                },


                options: {

                    responsive: true,


                    maintainAspectRatio: false,


                    interaction: {

                        intersect: false,

                        mode: "index"

                    },


                    plugins: {

                        legend: {

                            display: true,

                            labels: {

                                color: "#9fb0c5",

                                font: {

                                    size: 12

                                }

                            }

                        },


                        tooltip: {

                            enabled: true

                        }

                    },


                    scales: {

                        x: {

                            ticks: {

                                color: "#71849a"

                            },


                            grid: {

                                color:
                                    "rgba(255,255,255,0.05)"

                            }

                        },


                        y: {

                            beginAtZero: false,


                            ticks: {

                                color: "#71849a"

                            },


                            grid: {

                                color:
                                    "rgba(255,255,255,0.05)"

                            }

                        }

                    }

                }

            }
        );


    }


    // =================================================
    // CHART ERROR
    // =================================================

    catch (error) {

        console.error(
            "Error loading stock price:",
            error
        );

    }

}



// =====================================================
// QUICK STOCK BUTTON
// =====================================================

function setStock(symbol) {


    if (!stockInput) {

        console.error(
            "Stock input not found."
        );

        return;
    }


    // Put stock symbol into input

    stockInput.value = symbol;


    // Run analysis

    analyzeStock();


}



// =====================================================
// ENTER KEY SUPPORT
// =====================================================

if (stockInput) {

    stockInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                analyzeStock();

            }

        }
    );

}



// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "AI Stock Market Analyser loaded successfully."
        );

        console.log(
            "Flask API connection ready."
        );

    }
);