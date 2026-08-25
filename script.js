// =====================================================
// AI STOCK MARKET ANALYSER
// FRONTEND JAVASCRIPT
// =====================================================


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let stockChart = null;


// =====================================================
// DOM ELEMENTS
// =====================================================

const stockInput =
    document.getElementById("stockInput");

const result =
    document.getElementById("result");

const analyzeBtn =
    document.getElementById("analyzeBtn");


// =====================================================
// STOCK NAMES
// =====================================================

const stockNames = {

    RELIANCE:
        "Reliance Industries",

    TCS:
        "Tata Consultancy Services",

    INFY:
        "Infosys",

    HDFC:
        "HDFC Bank",

    ITC:
        "ITC Limited"

};


// =====================================================
// ANALYZE STOCK
// =====================================================

async function analyzeStock() {

    const stock =
        stockInput.value
            .trim()
            .toUpperCase();


    // =================================================
    // EMPTY INPUT
    // =================================================

    if (!stock) {

        result.innerHTML = `

            <div class="analysis-result">

                <h3>⚠ INPUT REQUIRED</h3>

                <h2>
                    Please enter a stock symbol
                </h2>

                <p>
                    Example:
                    RELIANCE, TCS, INFY,
                    HDFC or ITC
                </p>

            </div>

        `;

        return;
    }


    // =================================================
    // CHECK SUPPORTED STOCK
    // =================================================

    if (!stockNames[stock]) {

        result.innerHTML = `

            <div class="analysis-result">

                <h3>⚠ STOCK NOT SUPPORTED</h3>

                <h2>
                    ${stock}
                </h2>

                <p>
                    Please use RELIANCE, TCS,
                    INFY, HDFC or ITC.
                </p>

            </div>

        `;

        return;
    }


    // =================================================
    // COMPANY NAME
    // =================================================

    const companyName =
        stockNames[stock];


    // =================================================
    // LOADING MESSAGE
    // =================================================

    result.innerHTML = `

        <div class="analysis-result">

            <h3>
                🤖 AI ANALYSIS
            </h3>

            <h2>
                Analyzing ${companyName}...
            </h2>

            <p>
                Loading market information...
            </p>

        </div>

    `;


    // =================================================
    // DISABLE BUTTON
    // =================================================

    if (analyzeBtn) {

        analyzeBtn.disabled = true;

        analyzeBtn.innerHTML =
            "ANALYZING...";

    }


    // =================================================
    // START CHART AND ANALYSIS TOGETHER
    // =================================================

    const chartPromise =
        updateStockChart(
            stock,
            companyName
        );


    try {

        // =================================================
        // CALL ANALYSIS API
        // =================================================

        const response =
            await fetch(
                `/analyze?stock=${encodeURIComponent(stock)}`
            );


        const data =
            await response.json();


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Stock not available"
            );

        }


        // =================================================
        // SENTIMENT ICON
        // =================================================

        let sentimentIcon =
            "😐";


        if (
            data.sentiment &&
            data.sentiment
                .toLowerCase() ===
            "positive"
        ) {

            sentimentIcon =
                "😊";

        }

        else if (
            data.sentiment &&
            data.sentiment
                .toLowerCase() ===
            "negative"
        ) {

            sentimentIcon =
                "😟";

        }


        // =================================================
        // RECOMMENDATION
        // =================================================

        let recommendationClass =
            "hold";

        let recommendationIcon =
            "⏸️";


        if (
            data.recommendation ===
            "BUY"
        ) {

            recommendationClass =
                "buy";

            recommendationIcon =
                "📈";

        }

        else if (
            data.recommendation ===
            "SELL"
        ) {

            recommendationClass =
                "sell";

            recommendationIcon =
                "📉";

        }


        // =================================================
        // DISPLAY ANALYSIS
        // =================================================

        result.innerHTML = `

            <div class="analysis-result">

                <h3>
                    🤖 AI ANALYSIS COMPLETE
                </h3>


                <h2>
                    ${data.name || companyName}
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

                        <strong
                            class="${recommendationClass}"
                        >

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

            </div>

        `;


        // =================================================
        // WAIT FOR CHART
        // =================================================

        await chartPromise;

    }


    // =================================================
    // ERROR
    // =================================================

    catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        result.innerHTML = `

            <div class="analysis-result">

                <h3>
                    ❌ ERROR
                </h3>

                <h2>
                    ${error.message ||
                    "Unable to analyze stock"}
                </h2>

                <p>
                    Please try again.
                </p>

            </div>

        `;

    }


    // =================================================
    // ENABLE BUTTON
    // =================================================

    finally {

        if (analyzeBtn) {

            analyzeBtn.disabled =
                false;

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

async function updateStockChart(
    stock,
    companyName
) {

    const canvas =
        document.getElementById(
            "stockChart"
        );


    // =================================================
    // CANVAS CHECK
    // =================================================

    if (!canvas) {

        console.error(
            "Stock chart canvas not found."
        );

        return;

    }


    try {

        console.log(
            `Loading ${stock} chart...`
        );


        // =================================================
        // GET PRICE DATA
        // =================================================

        const response =
            await fetch(
                `/price/${encodeURIComponent(stock)}?t=${Date.now()}`
            );


        const data =
            await response.json();


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load stock price"
            );

        }


        // =================================================
        // CHECK DATA
        // =================================================

        if (
            !data.prices ||
            data.prices.length === 0
        ) {

            throw new Error(
                "No price data available"
            );

        }


        // =================================================
        // LABELS
        // =================================================

        const labels =
            data.prices.map(
                item =>
                    item.date
            );


        // =================================================
        // PRICES
        // =================================================

        const prices =
            data.prices.map(
                item =>
                    Number(item.price)
            );


        // =================================================
        // DESTROY PREVIOUS CHART
        // =================================================

        if (stockChart) {

            stockChart.destroy();

            stockChart =
                null;

        }


        // =================================================
        // FORCE CORRECT COMPANY NAME
        // =================================================

        let displayName =
            stockNames[stock] ||
            companyName ||
            stock;


        // IMPORTANT HDFC FIX

        if (stock === "HDFC") {

            displayName =
                "HDFC Bank";

        }


        // =================================================
        // UPDATE CHART HEADER
        // =================================================

        const selectedStock =
            document.querySelector(
                ".chart-header span"
            );


        if (selectedStock) {

            selectedStock.textContent =
                `${displayName} (${stock})`;

        }


        const chartTitle =
            document.querySelector(
                ".chart-header h3"
            );


        if (chartTitle) {

            chartTitle.textContent =
                `${displayName} Price Movement`;

        }


        // =================================================
        // CREATE CHART
        // =================================================

        stockChart =
            new Chart(
                canvas.getContext("2d"),
                {

                    type: "line",

                    data: {

                        labels:
                            labels,

                        datasets: [

                            {

                                label:
                                    `${displayName} (${stock})`,

                                data:
                                    prices,

                                borderWidth:
                                    3,

                                tension:
                                    0.35,

                                fill:
                                    true,

                                pointRadius:
                                    4,

                                pointHoverRadius:
                                    7

                            }

                        ]

                    },


                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,


                        interaction: {

                            intersect:
                                false,

                            mode:
                                "index"

                        },


                        plugins: {

                            legend: {

                                display:
                                    true,

                                labels: {

                                    color:
                                        "#9fb0c5",

                                    font: {

                                        size:
                                            12

                                    }

                                }

                            },


                            tooltip: {

                                enabled:
                                    true

                            }

                        },


                        scales: {

                            x: {

                                ticks: {

                                    color:
                                        "#71849a"

                                },

                                grid: {

                                    color:
                                        "rgba(255,255,255,0.05)"

                                }

                            },


                            y: {

                                beginAtZero:
                                    false,

                                ticks: {

                                    color:
                                        "#71849a"

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


        console.log(
            `${displayName} chart created successfully`
        );

    }


    catch (error) {

        console.error(
            `Chart error (${stock}):`,
            error
        );

    }

}


// =====================================================
// QUICK TRY BUTTON
// =====================================================

function setStock(symbol) {

    if (!stockInput) {

        console.error(
            "Stock input not found."
        );

        return;

    }


    stockInput.value =
        symbol.toUpperCase();


    // Analyze immediately
    analyzeStock();

}


// =====================================================
// ENTER KEY
// =====================================================

if (stockInput) {

    stockInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                analyzeStock();

            }

        }
    );

}


// =====================================================
// PAGE LOADED
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "AI Stock Market Analyser loaded successfully."
        );

    }
);
