// =====================================================
// AI STOCK MARKET ANALYSER
// FRONTEND JAVASCRIPT
// =====================================================

let stockChart = null;


// =====================================================
// DOM ELEMENTS
// =====================================================

const stockInput = document.getElementById("stockInput");
const result = document.getElementById("result");
const analyzeBtn = document.getElementById("analyzeBtn");


// =====================================================
// STOCK NAMES
// =====================================================

const stockNames = {

    RELIANCE: "Reliance Industries",

    TCS: "Tata Consultancy Services",

    INFY: "Infosys",

    HDFC: "HDFC Bank",

    ITC: "ITC Limited"

};


// =====================================================
// ANALYZE STOCK
// =====================================================

async function analyzeStock() {

    const stock =
        stockInput.value.trim().toUpperCase();


    // =================================================
    // EMPTY INPUT
    // =================================================

    if (!stock) {

        result.innerHTML = `
            <div class="analysis-result">

                <h3>⚠ INPUT REQUIRED</h3>

                <h2>Please enter a stock symbol</h2>

                <p>
                    Example:
                    RELIANCE, TCS, INFY, HDFC or ITC
                </p>

            </div>
        `;

        return;

    }


    // =================================================
    // COMPANY NAME
    // =================================================

    const companyName =
        stockNames[stock] || stock;


    // =================================================
    // SHOW LOADING
    // =================================================

    result.innerHTML = `
        <div class="analysis-result">

            <h3>🤖 AI ANALYSIS</h3>

            <h2>Analyzing ${companyName}...</h2>

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
    // START CHART IMMEDIATELY
    // =================================================

    const chartPromise =
        updateStockChart(
            stock,
            companyName
        );


    // =================================================
    // ANALYSIS API
    // =================================================

    try {

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
        // RECOMMENDATION
        // =================================================

        let recommendationClass =
            "hold";

        let recommendationIcon =
            "⏸️";


        if (data.recommendation === "BUY") {

            recommendationClass =
                "buy";

            recommendationIcon =
                "📈";

        }

        else if (data.recommendation === "SELL") {

            recommendationClass =
                "sell";

            recommendationIcon =
                "📉";

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
                    ${data.name || companyName}
                </h2>


                <p>
                    Stock Symbol:
                    <strong>${stock}</strong>
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
                    Please check the stock symbol
                    and try again.
                </p>

            </div>

        `;

    }


    // =================================================
    // ENABLE BUTTON
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

async function updateStockChart(
    stock,
    companyName
) {

    // =================================================
    // FIND OLD CANVAS
    // =================================================

    const oldCanvas =
        document.getElementById("stockChart");


    if (!oldCanvas) {

        console.error(
            "❌ stockChart canvas not found"
        );

        return;

    }


    try {

        console.log(
            `📊 Loading ${stock} chart...`
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
                "Unable to load price data"
            );

        }


        // =================================================
        // CHECK PRICE DATA
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
        // CREATE LABELS
        // =================================================

        const labels =
            data.prices.map(
                item => item.date
            );


        // =================================================
        // CREATE PRICE ARRAY
        // =================================================

        const prices =
            data.prices.map(
                item => Number(item.price)
            );


        console.log(
            `✅ ${stock} prices loaded`,
            prices
        );


        // =================================================
        // GET CORRECT COMPANY NAME
        // =================================================

        const displayName =
            stockNames[stock] ||
            companyName ||
            stock;


        console.log(
            "Stock:",
            stock
        );

        console.log(
            "Company:",
            displayName
        );


        // =================================================
        // DESTROY OLD CHART
        // =================================================

        if (stockChart) {

            stockChart.destroy();

            stockChart = null;

        }


        // =================================================
        // COMPLETELY REPLACE CANVAS
        // =================================================

        const newCanvas =
            document.createElement("canvas");


        newCanvas.id =
            "stockChart";


        oldCanvas.parentNode.replaceChild(
            newCanvas,
            oldCanvas
        );


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


        // =================================================
        // UPDATE CHART TITLE
        // =================================================

        const chartTitle =
            document.querySelector(
                ".chart-header h3"
            );


        if (chartTitle) {

            chartTitle.textContent =
                `${displayName} Price Movement`;

        }


        // =================================================
        // CREATE NEW CHART
        // =================================================

        stockChart =
            new Chart(
                newCanvas.getContext("2d"),
                {

                    type: "line",


                    // =====================================
                    // DATA
                    // =====================================

                    data: {

                        labels: labels,


                        datasets: [

                            {

                                label:
                                    `${displayName} (${stock})`,

                                data: prices,

                                borderWidth: 3,

                                tension: 0.35,

                                fill: true,

                                pointRadius: 4,

                                pointHoverRadius: 7

                            }

                        ]

                    },


                    // =====================================
                    // OPTIONS
                    // =====================================

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,


                        interaction: {

                            intersect: false,

                            mode: "index"

                        },


                        // =================================
                        // PLUGINS
                        // =================================

                        plugins: {

                            legend: {

                                display: true,

                                labels: {

                                    color:
                                        "#9fb0c5",

                                    font: {

                                        size: 12

                                    }

                                }

                            },


                            tooltip: {

                                enabled: true

                            }

                        },


                        // =================================
                        // SCALES
                        // =================================

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

                                beginAtZero: false,


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


        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            `🎉 ${displayName} chart created successfully`
        );

    }


    // =================================================
    // CHART ERROR
    // =================================================

    catch (error) {

        console.error(
            `❌ Chart error (${stock}):`,
            error
        );

    }

}



// =====================================================
// TRY STOCK BUTTON
// =====================================================

function setStock(symbol) {

    if (!stockInput) {

        console.error(
            "❌ Stock input not found"
        );

        return;

    }


    // =================================================
    // SET STOCK VALUE
    // =================================================

    stockInput.value =
        symbol.toUpperCase();


    // =================================================
    // ANALYZE IMMEDIATELY
    // =================================================

    analyzeStock();

}



// =====================================================
// ENTER KEY SUPPORT
// =====================================================

if (stockInput) {

    stockInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                analyzeStock();

            }

        }
    );

}



// =====================================================
// PAGE LOAD
// =====================================================

console.log(
    "======================================"
);

console.log(
    "✅ AI Stock Market Analyser loaded"
);

console.log(
    "✅ JavaScript connected successfully"
);

console.log(
    "======================================"
);
