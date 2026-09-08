// ============================================================
// AI STOCK MARKET ANALYSER
// Live Market Data + Price Chart + AI Probability Chart
// ============================================================

const API_URL = window.location.origin;

const supportedStocks = [
    "RELIANCE",
    "TCS",
    "INFY",
    "HDFC",
    "ITC"
];

let stockChartInstance = null;
let probabilityChartInstance = null;


// ============================================================
// DOM ELEMENTS
// ============================================================

const stockInput = document.getElementById("stockInput");
const analyzeBtn = document.getElementById("analyzeBtn");

const result = document.getElementById("result");

const stockChartCanvas = document.getElementById("stockChart");
const probabilityChartCanvas = document.getElementById("probabilityChart");


// ============================================================
// HELPER
// ============================================================

function getElement(id) {
    return document.getElementById(id);
}


function showMessage(message) {
    if (!result) return;

    result.innerHTML = `
        <div class="result-message">
            ${message}
        </div>
    `;
}


// ============================================================
// DECISION SIGNAL
// ============================================================

function updateDecisionSignal(recommendation, confidence) {

    const signal = getElement("decisionSignal");

    if (!signal) return;

    let icon = "🎯";
    let text = recommendation || "--";

    if (recommendation === "BUY") {
        icon = "🟢";
        text = "BUY";
    } else if (recommendation === "SELL") {
        icon = "🔴";
        text = "SELL";
    } else if (recommendation === "HOLD") {
        icon = "🟡";
        text = "HOLD";
    }

    signal.innerHTML = `
        <div class="signal-icon">${icon}</div>
        <div>
            <div class="signal-label">CURRENT SIGNAL</div>
            <div class="signal-value">${text}</div>
            <div class="signal-confidence">
                Confidence Score: ${confidence != null ? confidence + "%" : "--%"}
            </div>
        </div>
    `;
}


// ============================================================
// AI INSIGHTS
// ============================================================

function updateInsights(recommendation, probabilities) {

    const positiveInsight = getElement("positiveInsight");
    const neutralInsight = getElement("neutralInsight");
    const negativeInsight = getElement("negativeInsight");

    if (!probabilities) return;

    const buy = Number(probabilities.BUY || 0);
    const hold = Number(probabilities.HOLD || 0);
    const sell = Number(probabilities.SELL || 0);

    if (positiveInsight) {
        const value = positiveInsight.querySelector(".insight-value");

        if (value) {
            value.textContent = `${buy.toFixed(0)}%`;
        } else {
            positiveInsight.textContent = `${buy.toFixed(0)}%`;
        }
    }

    if (neutralInsight) {
        const value = neutralInsight.querySelector(".insight-value");

        if (value) {
            value.textContent = `${hold.toFixed(0)}%`;
        } else {
            neutralInsight.textContent = `${hold.toFixed(0)}%`;
        }
    }

    if (negativeInsight) {
        const value = negativeInsight.querySelector(".insight-value");

        if (value) {
            value.textContent = `${sell.toFixed(0)}%`;
        } else {
            negativeInsight.textContent = `${sell.toFixed(0)}%`;
        }
    }
}


// ============================================================
// PROBABILITY DOUGHNUT CHART
// ============================================================

function updateProbabilityChart(probabilities) {

    if (!probabilityChartCanvas) {
        console.warn("Probability chart canvas not found.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    const buy = Number(probabilities?.BUY || 0);
    const hold = Number(probabilities?.HOLD || 0);
    const sell = Number(probabilities?.SELL || 0);

    if (probabilityChartInstance) {
        probabilityChartInstance.destroy();
        probabilityChartInstance = null;
    }

    probabilityChartInstance = new Chart(probabilityChartCanvas, {
        type: "doughnut",

        data: {
            labels: [
                "BUY",
                "HOLD",
                "SELL"
            ],

            datasets: [
                {
                    data: [
                        buy,
                        hold,
                        sell
                    ],

                    backgroundColor: [
                        "#22c55e",
                        "#f59e0b",
                        "#ef4444"
                    ],

                    borderColor: "#0b1828",
                    borderWidth: 4,

                    hoverOffset: 8
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "62%",

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        color: "#9fb2c9",
                        padding: 18,
                        usePointStyle: true,
                        font: {
                            size: 13
                        }
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${Number(context.raw).toFixed(2)}%`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================================
// PRICE MOVEMENT CHART
// ============================================================

async function updateStockChart(symbol) {

    if (!stockChartCanvas) {
        console.warn("Stock chart canvas not found.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/price/${encodeURIComponent(symbol)}`
        );

        if (!response.ok) {
            throw new Error(
                `Price API returned ${response.status}`
            );
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }


        // =====================================================
        // CONVERT BACKEND DATA
        // Backend sends:
        // prices: [
        //   { date: "2026-09-01", price: 266.5 }
        // ]
        // =====================================================

        if (
            !Array.isArray(data.prices) ||
            data.prices.length === 0
        ) {
            throw new Error("No chart data available.");
        }


        const dates = data.prices.map(item => item.date);

        const prices = data.prices.map(item =>
            Number(item.price)
        );


        // =====================================================
        // DESTROY OLD CHART
        // =====================================================

        if (stockChartInstance) {

            stockChartInstance.destroy();

            stockChartInstance = null;

        }


        // =====================================================
        // CREATE NEW CHART
        // =====================================================

        stockChartInstance = new Chart(
            stockChartCanvas,
            {

                type: "line",


                data: {

                    labels: dates,


                    datasets: [

                        {

                            label: `${symbol} Price`,


                            data: prices,


                            borderColor: "#4da3df",


                            backgroundColor:
                                "rgba(77, 163, 223, 0.35)",


                            borderWidth: 3,


                            fill: true,


                            tension: 0.4,


                            pointRadius: 5,


                            pointHoverRadius: 8,


                            pointBackgroundColor:
                                "#1d6fa5",


                            pointBorderColor:
                                "#4da3df",


                            pointBorderWidth: 2


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


                            position: "top",


                            labels: {

                                color: "#9aa7b8",


                                padding: 20,


                                font: {

                                    size: 13

                                }

                            }

                        },


                        tooltip: {

                            backgroundColor:
                                "#0d1b2b",


                            titleColor:
                                "#ffffff",


                            bodyColor:
                                "#b8c7d9",


                            borderColor:
                                "#2c4c68",


                            borderWidth: 1,


                            padding: 12,


                            callbacks: {

                                label: function(context) {

                                    return (
                                        " ₹" +
                                        Number(
                                            context.raw
                                        ).toFixed(2)
                                    );

                                }

                            }

                        }

                    },


                    scales: {


                        x: {

                            ticks: {

                                color: "#8b96a5",

                                maxRotation: 0,

                                autoSkip: false

                            },


                            grid: {

                                color:
                                    "rgba(100,130,160,0.06)"

                            }

                        },


                        y: {


                            ticks: {

                                color: "#8b96a5",


                                callback: function(value) {

                                    return value.toFixed(1);

                                }

                            },


                            grid: {

                                color:
                                    "rgba(100,130,160,0.12)"

                            }


                        }

                    }


                }

            }
        );


        console.log(
            `Price chart loaded for ${symbol}`
        );


    }

    catch (error) {

        console.error(
            `Unable to load chart for ${symbol}:`,
            error
        );

    }

}

// ============================================================
// MARKET HEATMAP
// ============================================================

async function updateHeatmap() {

    const heatmap = getElement("marketHeatmap");

    if (!heatmap) {
        return;
    }

    heatmap.innerHTML = `
        <div class="heatmap-loading">
            Loading live market data...
        </div>
    `;

    const results = [];

    for (const symbol of supportedStocks) {

        try {

            const response = await fetch(
                `${API_URL}/price/${encodeURIComponent(symbol)}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            results.push({
                symbol: symbol,
                name: data.name || symbol,
                price: Number(data.price || 0),
                change: Number(data.changePercent || 0)
            });

        } catch (error) {

            console.error(
                `Heatmap error for ${symbol}:`,
                error
            );

            results.push({
                symbol: symbol,
                name: symbol,
                price: 0,
                change: 0,
                error: true
            });
        }
    }

    heatmap.innerHTML = "";

    results.forEach(stock => {

        const item = document.createElement("div");

        item.className = "heatmap-item";

        if (stock.error) {
            item.classList.add("heatmap-error");
        }

        const positive = stock.change >= 0;

        item.innerHTML = `
            <div class="heatmap-symbol">
                ${stock.symbol}
            </div>

            <div class="heatmap-name">
                ${stock.name}
            </div>

            <div class="heatmap-price">
                ${stock.price
                    ? "₹" + stock.price.toLocaleString("en-IN", {
                        maximumFractionDigits: 2
                    })
                    : "--"}
            </div>

            <div class="heatmap-change ${positive ? "positive" : "negative"}">
                ${stock.price
                    ? `${positive ? "▲ +" : "▼ "}${stock.change.toFixed(2)}%`
                    : "--"}
            </div>
        `;

        item.addEventListener("click", () => {

            setStock(stock.symbol);

            const analysisSection =
                document.getElementById("analysis");

            if (analysisSection) {
                analysisSection.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });

        heatmap.appendChild(item);
    });
}


// ============================================================
// ANALYSE STOCK
// ============================================================

async function analyzeStock(stock) {

    stock = stock.trim().toUpperCase();

    if (!stock) {

        showMessage("Please enter a stock symbol.");

        return;
    }

    if (!supportedStocks.includes(stock)) {

        showMessage(
            `Stock not available. Please use one of: ${supportedStocks.join(", ")}`
        );

        return;
    }

    if (analyzeBtn) {

        analyzeBtn.disabled = true;

        const originalText = analyzeBtn.innerHTML;

        analyzeBtn.innerHTML = `
            ANALYZING...
        `;

        try {

            const response = await fetch(
                `${API_URL}/analyze?stock=${encodeURIComponent(stock)}`
            );

            if (!response.ok) {

                let errorMessage = `Server error (${response.status})`;

                try {

                    const errorData = await response.json();

                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }

                } catch (e) {
                    // Ignore JSON parsing error
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            console.log("Analysis result:", data);


            // ------------------------------------------------
            // UPDATE DECISION
            // ------------------------------------------------

            updateDecisionSignal(
                data.recommendation,
                data.confidence
            );


            // ------------------------------------------------
            // UPDATE INSIGHTS
            // ------------------------------------------------

            updateInsights(
                data.recommendation,
                data.probabilities
            );


            // ------------------------------------------------
            // UPDATE PROBABILITY CHART
            // ------------------------------------------------

            updateProbabilityChart(
                data.probabilities
            );


            // ------------------------------------------------
            // UPDATE RESULT BOX
            // ------------------------------------------------

            if (result) {

                result.innerHTML = `
                    <div class="analysis-result">

                        <div class="result-stock">
                            ${data.name || stock}
                        </div>

                        <div class="result-symbol">
                            ${data.symbol || stock}
                        </div>

                        <div class="result-recommendation">
                            ${data.recommendation || "--"}
                        </div>

                        <div class="result-confidence">
                            Confidence: ${data.confidence != null
                                ? data.confidence + "%"
                                : "--"}
                        </div>

                        <div class="result-price">
                            ₹${data.price != null
                                ? Number(data.price).toLocaleString("en-IN", {
                                    maximumFractionDigits: 2
                                })
                                : "--"}
                        </div>

                        <div class="result-sentiment">
                            Sentiment: ${data.sentiment || "--"}
                        </div>

                    </div>
                `;
            }


            // ------------------------------------------------
            // LOAD LIVE PRICE CHART
            // ------------------------------------------------

            updateStockChart(stock);


        } catch (error) {

            console.error("Analysis error:", error);

            showMessage(
                `Unable to analyse ${stock}. ${error.message}`
            );

        } finally {

            analyzeBtn.disabled = false;

            analyzeBtn.innerHTML = `
                ANALYZE
                <span>→</span>
            `;
        }
    }
}


// ============================================================
// SET STOCK
// ============================================================

function setStock(stock) {

    stock = stock.toUpperCase();

    if (stockInput) {
        stockInput.value = stock;
    }

    updateStockChart(stock);
}


// ============================================================
// ANALYZE BUTTON
// ============================================================

if (analyzeBtn) {

    analyzeBtn.addEventListener("click", function() {

        const stock =
            stockInput ? stockInput.value : "";

        analyzeStock(stock);
    });
}


// ============================================================
// ENTER KEY
// ============================================================

if (stockInput) {

    stockInput.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            analyzeStock(stockInput.value);
        }
    });
}


// ============================================================
// TRY STOCK BUTTONS
// ============================================================

document.addEventListener("click", function(event) {

    const button =
        event.target.closest("[data-stock-select]");

    if (!button) {
        return;
    }

    const stock =
        button.dataset.stockSelect;

    if (stock) {

        setStock(stock);

        analyzeStock(stock);
    }
});


// ============================================================
// INITIAL PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", function() {

    console.log("AI Stock Market Analyser loaded.");


    // Load heatmap
    updateHeatmap();

    // Default stock chart
    // This prevents the large blank chart area
    // when the page is first opened.
    updateStockChart("RELIANCE");

    // Put default stock into input if empty
    if (
        stockInput &&
        stockInput.value.trim() === ""
    ) {
        stockInput.value = "RELIANCE";
    }

});


// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(function() {

    updateHeatmap();

}, 60000);


// ============================================================
// EXPORT FOR DEBUGGING
// ============================================================

window.analyzeStock = analyzeStock;
window.updateStockChart = updateStockChart;
window.updateHeatmap = updateHeatmap;
window.setStock = setStock;
