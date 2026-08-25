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


    if (analyzeBtn) {

        analyzeBtn.disabled = true;

        analyzeBtn.innerHTML =
            "ANALYZING...";

    }


    // =================================================
    // START CHART IMMEDIATELY
    // =================================================

    // IMPORTANT:
    // Chart request is NOT waiting for analysis API.

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

                    <div>

                        <span>
                            Market Sentiment
                        </span>

                        <strong>
                            ${sentimentIcon}
                            ${data.sentiment || "N/A"}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Recommendation
                        </span>

                        <strong class="${recommendationClass}">

                            ${recommendationIcon}

                            ${data.recommendation || "N/A"}

                        </strong>

                    </div>


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


        // Wait for chart to finish

        await chartPromise;

    }


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

    const canvas =
        document.getElementById("stockChart");


    // =================================================
    // CANVAS CHECK
    // =================================================

    if (!canvas) {

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
        // PRICE API
        // =================================================

        const response =
            await fetch(
                `/price/${encodeURIComponent(stock)}?t=${Date.now()}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load price data"
            );

        }


        // =================================================
        // CHECK PRICES
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
                item => item.date
            );


        // =================================================
        // PRICES
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
        // DESTROY OLD CHART
        // =================================================

        if (stockChart) {

            stockChart.destroy();

            stockChart = null;

        }


        // =================================================
        // FORCE COMPANY NAME
        // =================================================

        let displayName =
            companyName || stock;


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


        console.log(
            `🎉 ${displayName} chart created`
        );

    }


    catch (error) {

        console.error(
            `❌ Chart error (${stock}):`,
            error
        );

    }

}



// =====================================================
// TRY BUTTON
// =====================================================

function setStock(symbol) {

    if (!stockInput) {

        console.error(
            "Stock input not found"
        );

        return;

    }


    // Set value

    stockInput.value =
        symbol.toUpperCase();


    // IMPORTANT:
    // Run immediately on FIRST click

    analyzeStock();

}



// =====================================================
// ENTER KEY
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
// PAGE LOADED
// =====================================================

console.log(
    "✅ AI Stock Market Analyser JavaScript loaded"
);
