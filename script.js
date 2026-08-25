// =====================================================
// AI STOCK MARKET ANALYSER
// FRONTEND JAVASCRIPT
// =====================================================

let stockChart = null;

const stockInput = document.getElementById("stockInput");
const result = document.getElementById("result");
const analyzeBtn = document.getElementById("analyzeBtn");


// =====================================================
// ANALYZE STOCK
// =====================================================

async function analyzeStock() {

    const stock = stockInput.value.trim().toUpperCase();

    if (stock === "") {

        result.innerHTML = `
            <div class="analysis-result">
                <h3>⚠ INPUT REQUIRED</h3>
                <h2>Please enter a stock symbol</h2>
                <p>
                    Example:
                    <strong>RELIANCE</strong>,
                    <strong>TCS</strong>,
                    <strong>INFY</strong>,
                    <strong>HDFC</strong>
                </p>
            </div>
        `;

        return;
    }


    // ================= LOADING =================

    result.innerHTML = `
        <div class="analysis-result">
            <h3>🤖 AI ANALYSIS</h3>
            <h2>Analyzing ${stock}...</h2>
            <p>Fetching stock information and market data...</p>
        </div>
    `;


    if (analyzeBtn) {

        analyzeBtn.disabled = true;

        analyzeBtn.innerHTML = `
            ANALYZING...
        `;
    }


    try {

        // =================================================
        // 1. GET ANALYSIS DATA
        // =================================================

        const analysisResponse = await fetch(
            `/analyze?stock=${encodeURIComponent(stock)}`
        );


        if (!analysisResponse.ok) {

            let errorData = {};

            try {
                errorData = await analysisResponse.json();
            } catch (e) {
                errorData = {};
            }

            throw new Error(
                errorData.error || "Stock not available"
            );
        }


        const data = await analysisResponse.json();


        // =================================================
        // 2. SENTIMENT
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
        // 3. RECOMMENDATION
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


        // =================================================
        // 4. DISPLAY ANALYSIS
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
                    <strong>${stock}</strong>
                </p>

                <div class="analysis-details">

                    <div>
                        <span>Market Sentiment</span>

                        <strong>
                            ${sentimentIcon}
                            ${data.sentiment || "N/A"}
                        </strong>
                    </div>


                    <div>
                        <span>Recommendation</span>

                        <strong class="${recommendationClass}">
                            ${recommendationIcon}
                            ${data.recommendation || "N/A"}
                        </strong>
                    </div>


                    <div>
                        <span>Confidence Score</span>

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
        // 5. LOAD GRAPH
        // =================================================

        await updateStockChart(stock, data.name);


    } catch (error) {

        console.error("Analysis error:", error);


        result.innerHTML = `
            <div class="analysis-result">

                <h3>❌ ERROR</h3>

                <h2>
                    ${error.message || "Unable to analyze stock"}
                </h2>

                <p>
                    Please check the stock symbol and try again.
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

async function updateStockChart(stock, companyName = stock) {

    const canvas = document.getElementById("stockChart");


    if (!canvas) {

        console.error("Stock chart canvas not found.");

        return;
    }


    try {

        // =================================================
        // SHOW LOADING IN CHART AREA
        // =================================================

        console.log(`Loading price data for ${stock}...`);


        // =================================================
        // GET PRICE DATA
        // =================================================

        const priceResponse = await fetch(
            `/price/${encodeURIComponent(stock)}?t=${Date.now()}`
        );


        if (!priceResponse.ok) {

            let errorData = {};

            try {
                errorData = await priceResponse.json();
            } catch (e) {
                errorData = {};
            }

            throw new Error(
                errorData.error || "Unable to load stock price"
            );
        }


        const priceData = await priceResponse.json();


        // =================================================
        // CHECK PRICE DATA
        // =================================================

        if (
            !priceData.prices ||
            priceData.prices.length === 0
        ) {

            throw new Error(
                `No price data available for ${stock}`
            );
        }


        // =================================================
        // CREATE LABELS
        // =================================================

        const labels = priceData.prices.map(
            item => item.date
        );


        // =================================================
        // CREATE PRICES
        // =================================================

        const prices = priceData.prices.map(
            item => Number(item.price)
        );


        console.log(
            `${stock} price data loaded:`,
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
        // UPDATE CHART TITLE
        // =================================================

        const chartTitle =
            document.querySelector(".chart-header h3");

        if (chartTitle) {

            chartTitle.textContent =
                `${companyName || stock} Price Movement`;
        }


        // =================================================
        // UPDATE SELECTED STOCK TEXT
        // =================================================

        const selectedStock =
            document.querySelector(".chart-header span");

        if (selectedStock) {

            selectedStock.textContent =
                `${companyName || stock} (${stock})`;
        }


        // =================================================
        // CREATE NEW CHART
        // =================================================

        stockChart = new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                `${companyName || stock} (${stock})`,

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


        console.log(
            `${stock} chart created successfully`
        );

    }


    catch (error) {

        console.error(
            `Chart error for ${stock}:`,
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


    // Put selected stock into input

    stockInput.value = symbol;


    // IMPORTANT:
    // Analyze immediately on FIRST click

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

                event.preventDefault();

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
