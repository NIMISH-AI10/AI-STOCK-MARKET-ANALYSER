const stockInput = document.getElementById("stockInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");
const stockChartCanvas = document.getElementById("stockChart");

const API_URL =
    "https://ai-stock-market-analyser-1-gfsd.onrender.com";

let stockChartInstance = null;
let probabilityChartInstance = null;


// =====================================================
// STOCK INFORMATION
// =====================================================

const stockNames = {
    RELIANCE: "Reliance Industries",
    TCS: "Tata Consultancy Services",
    INFY: "Infosys",
    HDFC: "HDFC Bank",
    ITC: "ITC Limited"
};


// =====================================================
// AI DECISION SIGNAL
// =====================================================

function updateDecisionSignal(data) {

    const decisionSignal =
        document.getElementById("decisionSignal");

    const decisionConfidence =
        document.getElementById("decisionConfidence");

    if (!decisionSignal) return;

    const recommendation =
        data.recommendation || "N/A";

    decisionSignal.textContent =
        recommendation;

    decisionSignal.classList.remove(
        "buy",
        "sell",
        "hold"
    );

    if (recommendation === "BUY") {

        decisionSignal.classList.add("buy");

    } else if (recommendation === "SELL") {

        decisionSignal.classList.add("sell");

    } else {

        decisionSignal.classList.add("hold");
    }

    if (decisionConfidence) {

        decisionConfidence.textContent =
            data.confidence !== undefined
                ? `${Number(data.confidence).toFixed(2)}%`
                : "N/A";
    }
}


// =====================================================
// ANALYZE STOCK
// =====================================================

async function analyzeStock(stock) {

    if (!stock) {

        stock =
            stockInput
                ? stockInput.value
                : "";
    }

    stock =
        stock.trim().toUpperCase();

    if (!stock) {

        alert(
            "Please enter a stock symbol."
        );

        return;
    }

    if (analyzeBtn) {

        analyzeBtn.disabled = true;

        analyzeBtn.textContent =
            "ANALYZING...";
    }

    if (result) {

        result.innerHTML = `
            <div class="loading">
                <p>Analyzing ${stock}...</p>
                <p>Please wait...</p>
            </div>
        `;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/analyze?stock=${encodeURIComponent(stock)}`
            );

        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
                errorData.error ||
                "Unable to analyze stock."
            );
        }

        const data =
            await response.json();

        updateDecisionSignal(data);

        displayAnalysisResult(data);

        updateProbabilityChart(data);

        await updateStockChart(data);

        updateInsightCards(data);

    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );

        if (result) {

            result.innerHTML = `
                <div class="error">
                    <h2>❌ ERROR</h2>
                    <p>${error.message}</p>
                    <p>Please check the stock symbol and try again.</p>
                </div>
            `;
        }

    } finally {

        if (analyzeBtn) {

            analyzeBtn.disabled = false;

            analyzeBtn.textContent =
                "ANALYZE →";
        }
    }
}


// =====================================================
// DISPLAY ANALYSIS
// =====================================================

function displayAnalysisResult(data) {

    if (!result) return;

    const probabilities =
        data.probabilities || {};

    result.innerHTML = `

        <div class="analysis-result">

            <h3>AI STOCK ANALYSIS</h3>

            <h2>
                ${data.name || data.symbol}
            </h2>

            <p>
                Symbol:
                <strong>${data.symbol}</strong>
            </p>

            <div class="analysis-details">

                <div>
                    <span>PRICE</span>
                    <strong>
                        ₹${data.price ?? "N/A"}
                    </strong>
                </div>

                <div>
                    <span>RECOMMENDATION</span>
                    <strong class="${getSignalClass(data.recommendation)}">
                        ${data.recommendation || "N/A"}
                    </strong>
                </div>

                <div>
                    <span>CONFIDENCE</span>
                    <strong>
                        ${data.confidence ?? "N/A"}%
                    </strong>
                </div>

                <div>
                    <span>SENTIMENT</span>
                    <strong>
                        ${data.sentiment || "N/A"}
                    </strong>
                </div>

                <div>
                    <span>BUY</span>
                    <strong class="buy">
                        ${probabilities.BUY ?? 0}%
                    </strong>
                </div>

                <div>
                    <span>HOLD</span>
                    <strong class="hold">
                        ${probabilities.HOLD ?? 0}%
                    </strong>
                </div>

            </div>

        </div>
    `;
}


function getSignalClass(signal) {

    if (signal === "BUY")
        return "buy";

    if (signal === "SELL")
        return "sell";

    return "hold";
}


// =====================================================
// PROBABILITY DONUT CHART
// =====================================================

async function updateProbabilityChart(data) {

    const canvas =
        document.getElementById(
            "probabilityChart"
        );

    if (!canvas) return;

    if (typeof Chart === "undefined")
        return;

    const probabilities =
        data.probabilities || {};

    if (probabilityChartInstance) {

        probabilityChartInstance.destroy();
    }

    probabilityChartInstance =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: [
                    "BUY",
                    "HOLD",
                    "SELL"
                ],

                datasets: [{

                    data: [

                        Number(
                            probabilities.BUY || 0
                        ),

                        Number(
                            probabilities.HOLD || 0
                        ),

                        Number(
                            probabilities.SELL || 0
                        )

                    ],

                    borderWidth: 0
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "68%",

                plugins: {

                    legend: {
                        position: "bottom"
                    }
                }
            }
        });
}


// =====================================================
// LIVE STOCK CHART
// =====================================================

async function updateStockChart(data) {

    const canvas =
        document.getElementById(
            "stockChart"
        );

    if (!canvas)
        return;

    if (typeof Chart === "undefined")
        return;

    try {

        const response =
            await fetch(
                `${API_URL}/price/${data.symbol}`
            );

        if (!response.ok)
            return;

        const marketData =
            await response.json();

        const prices =
            marketData.prices || [];

        if (!prices.length)
            return;

        if (stockChartInstance) {

            stockChartInstance.destroy();
        }

        stockChartInstance =
            new Chart(
                canvas,
                {

                    type: "line",

                    data: {

                        labels:
                            prices.map(
                                item => item.date
                            ),

                        datasets: [{

                            label:
                                `${data.symbol} Price`,

                            data:
                                prices.map(
                                    item => item.price
                                ),

                            tension: 0.35,

                            fill: true,

                            pointRadius: 4,

                            pointHoverRadius: 6
                        }]
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
                                display: true
                            }
                        },

                        scales: {

                            y: {

                                beginAtZero: false
                            }
                        }
                    }
                }
            );

    } catch (error) {

        console.error(
            "Chart error:",
            error
        );
    }
}


// =====================================================
// LIVE MARKET OVERVIEW
// =====================================================

async function loadMarketData() {

    try {

        const response =
            await fetch(
                `${API_URL}/market-data`
            );

        if (!response.ok)
            throw new Error(
                "Market data unavailable"
            );

        const data =
            await response.json();

        updateMarketCards(
            data.market
        );

        updateHeatmap(
            data.market
        );

    } catch (error) {

        console.error(
            "Market data error:",
            error
        );
    }
}


// =====================================================
// MARKET CARDS
// =====================================================

function updateMarketCards(stocks) {

    stocks.forEach(stock => {

        const card =
            document.querySelector(
                `[data-stock="${stock.symbol}"]`
            );

        if (!card)
            return;

        const price =
            card.querySelector(
                ".dashboard-price"
            );

        const change =
            card.querySelector(
                ".market-change"
            );

        if (price) {

            price.textContent =
                `₹${Number(stock.price).toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )}`;
        }

        if (change) {

            const percentage =
                Number(
                    stock.changePercent
                );

            change.textContent =
                `${percentage >= 0 ? "▲" : "▼"} ${
                    percentage >= 0 ? "+" : ""
                }${percentage.toFixed(2)}%`;

            change.classList.remove(
                "positive",
                "negative"
            );

            change.classList.add(
                percentage >= 0
                    ? "positive"
                    : "negative"
            );
        }

        card.classList.remove(
            "market-up",
            "market-down"
        );

        card.classList.add(
            stock.changePercent >= 0
                ? "market-up"
                : "market-down"
        );
    });
}


// =====================================================
// MARKET HEATMAP
// =====================================================

function updateHeatmap(stocks) {

    const heatmap =
        document.getElementById(
            "marketHeatmap"
        );

    if (!heatmap)
        return;

    heatmap.innerHTML = "";

    stocks.forEach(stock => {

        const percentage =
            Number(
                stock.changePercent
            );

        const tile =
            document.createElement(
                "div"
            );

        tile.className =
            "heatmap-tile";

        tile.classList.add(
            percentage >= 0
                ? "heat-positive"
                : "heat-negative"
        );

        tile.innerHTML = `

            <div class="heatmap-symbol">
                ${stock.symbol}
            </div>

            <div class="heatmap-price">
                ₹${Number(stock.price).toLocaleString(
                    "en-IN",
                    {
                        maximumFractionDigits: 2
                    }
                )}
            </div>

            <div class="heatmap-change">
                ${percentage >= 0 ? "+" : ""}
                ${percentage.toFixed(2)}%
            </div>

        `;

        heatmap.appendChild(
            tile
        );
    });
}


// =====================================================
// DYNAMIC INSIGHTS
// =====================================================

function updateInsightCards(data) {

    const probabilities =
        data.probabilities || {};

    const buy =
        Number(probabilities.BUY || 0);

    const hold =
        Number(probabilities.HOLD || 0);

    const sell =
        Number(probabilities.SELL || 0);

    const positive =
        document.getElementById(
            "positiveInsight"
        );

    const neutral =
        document.getElementById(
            "neutralInsight"
        );

    const negative =
        document.getElementById(
            "negativeInsight"
        );

    if (positive)
        positive.textContent =
            `${buy.toFixed(2)}%`;

    if (neutral)
        neutral.textContent =
            `${hold.toFixed(2)}%`;

    if (negative)
        negative.textContent =
            `${sell.toFixed(2)}%`;
}


// =====================================================
// QUICK STOCK BUTTON
// =====================================================

function setStock(stock) {

    if (stockInput) {

        stockInput.value =
            stock;
    }

    analyzeStock(stock);
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

                analyzeStock(
                    stockInput.value
                );
            }
        }
    );
}


// =====================================================
// ANALYZE BUTTON
// =====================================================

if (analyzeBtn) {

    analyzeBtn.addEventListener(
        "click",
        function() {

            analyzeStock(
                stockInput.value
            );
        }
    );
}


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "AI Stock Market Analyser loaded."
        );

        loadMarketData();

        // Refresh market data every 5 minutes
        setInterval(
            loadMarketData,
            5 * 60 * 1000
        );
    }
);
