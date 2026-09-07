const stockInput = document.getElementById("stockInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");

const stockChartCanvas =
    document.getElementById("stockChart");

const probabilityChartCanvas =
    document.getElementById("probabilityChart");


// =====================================================
// API
// =====================================================

const API_URL =
    "https://ai-stock-market-analyser-1-gfsd.onrender.com";


// =====================================================
// STOCKS
// =====================================================

const supportedStocks = [
    "RELIANCE",
    "TCS",
    "INFY",
    "HDFC",
    "ITC"
];


// =====================================================
// DECISION SIGNAL
// =====================================================

function updateDecisionSignal(data) {

    const decisionSignal =
        document.getElementById("decisionSignal");

    const decisionConfidence =
        document.getElementById("decisionConfidence");

    if (!decisionSignal) {
        return;
    }

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

        const confidence =
            Number(data.confidence);

        if (!isNaN(confidence)) {

            decisionConfidence.textContent =
                `${confidence.toFixed(2)}%`;

        } else {

            decisionConfidence.textContent =
                "N/A";
        }
    }
}


// =====================================================
// UPDATE AI INSIGHTS
// =====================================================

function updateInsights(data) {

    const positive =
        document.getElementById("positiveInsight");

    const neutral =
        document.getElementById("neutralInsight");

    const negative =
        document.getElementById("negativeInsight");


    const probabilities =
        data.probabilities || {};


    const buy =
        Number(probabilities.BUY || 0);

    const hold =
        Number(probabilities.HOLD || 0);

    const sell =
        Number(probabilities.SELL || 0);


    if (positive) {
        positive.textContent =
            `${buy.toFixed(2)}%`;
    }

    if (neutral) {
        neutral.textContent =
            `${hold.toFixed(2)}%`;
    }

    if (negative) {
        negative.textContent =
            `${sell.toFixed(2)}%`;
    }
}


// =====================================================
// PROBABILITY CHART
// =====================================================

function updateProbabilityChart(data) {

    if (!probabilityChartCanvas) {
        return;
    }

    const probabilities =
        data.probabilities || {};


    const buy =
        Number(probabilities.BUY || 0);

    const hold =
        Number(probabilities.HOLD || 0);

    const sell =
        Number(probabilities.SELL || 0);


    const ctx =
        probabilityChartCanvas.getContext("2d");


    if (window.probabilityChartInstance) {

        window.probabilityChartInstance.destroy();
    }


    window.probabilityChartInstance =
        new Chart(ctx, {

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

                        borderWidth: 2
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "65%",

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                }

            }

        });
}


// =====================================================
// STOCK PRICE CHART
// =====================================================

async function updateStockChart(symbol) {

    try {

        const response =
            await fetch(
                `${API_URL}/price/${encodeURIComponent(symbol)}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load market data."
            );
        }


        const data =
            await response.json();


        if (!stockChartCanvas) {
            return;
        }


        const ctx =
            stockChartCanvas.getContext("2d");


        if (window.stockChartInstance) {

            window.stockChartInstance.destroy();
        }


        window.stockChartInstance =
            new Chart(ctx, {

                type: "line",

                data: {

                    labels:
                        data.dates || [],

                    datasets: [

                        {

                            label:
                                `${data.symbol} Price`,

                            data:
                                data.prices || [],

                            tension: 0.35,

                            fill: true,

                            pointRadius: 2

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
                            display: true
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: false

                        }

                    }

                }

            });

    } catch (error) {

        console.error(
            "Stock chart error:",
            error
        );
    }
}


// =====================================================
// LIVE MARKET CARDS
// =====================================================

async function updateMarketCards() {

    const cards =
        document.querySelectorAll(
            ".dashboard-card[data-stock]"
        );


    for (const card of cards) {

        const symbol =
            card.dataset.stock;

        if (!symbol) {
            continue;
        }


        try {

            const response =
                await fetch(
                    `${API_URL}/price/${symbol}`
                );


            if (!response.ok) {
                continue;
            }


            const data =
                await response.json();


            const priceElement =
                card.querySelector(
                    ".dashboard-price"
                );


            const changeElement =
                card.querySelector(
                    ".market-change"
                );


            const arrowElement =
                card.querySelector(
                    ".dashboard-arrow"
                );


            if (priceElement) {

                priceElement.textContent =
                    `₹${Number(data.price).toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}`;
            }


            if (changeElement) {

                const change =
                    Number(
                        data.change_percent
                    );


                changeElement.classList.remove(
                    "positive",
                    "negative"
                );


                if (change > 0) {

                    changeElement.classList.add(
                        "positive"
                    );

                    changeElement.textContent =
                        `▲ +${change.toFixed(2)}%`;

                } else if (change < 0) {

                    changeElement.classList.add(
                        "negative"
                    );

                    changeElement.textContent =
                        `▼ ${change.toFixed(2)}%`;

                } else {

                    changeElement.textContent =
                        "— 0.00%";
                }
            }


            if (arrowElement) {

                arrowElement.classList.remove(
                    "positive",
                    "negative"
                );


                if (data.change_percent > 0) {

                    arrowElement.textContent =
                        "↗";

                    arrowElement.classList.add(
                        "positive"
                    );

                } else if (
                    data.change_percent < 0
                ) {

                    arrowElement.textContent =
                        "↘";

                    arrowElement.classList.add(
                        "negative"
                    );

                } else {

                    arrowElement.textContent =
                        "→";
                }
            }


        } catch (error) {

            console.error(
                `Market card error for ${symbol}:`,
                error
            );
        }
    }
}


// =====================================================
// HEATMAP
// =====================================================

async function updateHeatmap() {

    const heatmap =
        document.getElementById(
            "marketHeatmap"
        );


    if (!heatmap) {
        return;
    }


    heatmap.innerHTML =
        `<div class="heatmap-loading">
            Loading live market data...
        </div>`;


    const results = [];


    for (const symbol of supportedStocks) {

        try {

            const response =
                await fetch(
                    `${API_URL}/price/${symbol}`
                );


            if (!response.ok) {
                continue;
            }


            const data =
                await response.json();


            results.push(data);


        } catch (error) {

            console.error(
                `Heatmap error for ${symbol}:`,
                error
            );
        }
    }


    if (results.length === 0) {

        heatmap.innerHTML =
            `<div class="heatmap-loading">
                Live market data unavailable.
            </div>`;

        return;
    }


    heatmap.innerHTML = "";


    results.forEach(data => {

        const change =
            Number(data.change_percent || 0);


        const tile =
            document.createElement("div");


        tile.className =
            "heatmap-tile";


        if (change > 0) {

            tile.classList.add(
                "heat-positive"
            );

        } else if (change < 0) {

            tile.classList.add(
                "heat-negative"
            );

        } else {

            tile.classList.add(
                "heat-neutral"
            );
        }


        tile.innerHTML = `

            <div class="heatmap-symbol">
                ${data.symbol}
            </div>

            <div class="heatmap-price">
                ₹${Number(data.price).toLocaleString(
                    "en-IN",
                    {
                        maximumFractionDigits: 2
                    }
                )}
            </div>

            <div class="heatmap-change">
                ${
                    change > 0
                        ? "▲ +"
                        : change < 0
                            ? "▼ "
                            : "— "
                }${change.toFixed(2)}%
            </div>

        `;


        heatmap.appendChild(tile);

    });
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

        analyzeBtn.disabled =
            true;

        analyzeBtn.textContent =
            "ANALYZING...";
    }


    if (result) {

        result.innerHTML = `

            <div class="loading">

                <p>
                    Analyzing ${stock}...
                </p>

                <p>
                    Please wait...
                </p>

            </div>

        `;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/analyze?stock=${encodeURIComponent(stock)}`
            );


        if (!response.ok) {

            let message =
                "Unable to analyze stock.";

            try {

                const error =
                    await response.json();

                if (error.error) {
                    message =
                        error.error;
                }

            } catch (e) {
                console.log(e);
            }

            throw new Error(message);
        }


        const data =
            await response.json();


        updateDecisionSignal(data);

        updateInsights(data);

        updateProbabilityChart(data);


        if (result) {

            result.innerHTML = `

                <div class="analysis-result">

                    <h3>
                        AI ANALYSIS
                    </h3>

                    <h2>
                        ${data.name || stock}
                    </h2>

                    <p>
                        Symbol:
                        <strong>
                            ${data.symbol || stock}
                        </strong>
                    </p>

                    <div class="analysis-details">

                        <div>

                            <span>
                                CURRENT PRICE
                            </span>

                            <strong>
                                ₹${data.price ?? "N/A"}
                            </strong>

                        </div>


                        <div>

                            <span>
                                RECOMMENDATION
                            </span>

                            <strong class="${
                                data.recommendation === "BUY"
                                    ? "buy"
                                    : data.recommendation === "SELL"
                                        ? "sell"
                                        : "hold"
                            }">

                                ${data.recommendation || "N/A"}

                            </strong>

                        </div>


                        <div>

                            <span>
                                CONFIDENCE
                            </span>

                            <strong>
                                ${
                                    data.confidence !== undefined
                                        ? Number(data.confidence).toFixed(2)
                                        : "N/A"
                                }%
                            </strong>

                        </div>


                        <div>

                            <span>
                                SENTIMENT
                            </span>

                            <strong>
                                ${data.sentiment || "N/A"}
                            </strong>

                        </div>


                        <div>

                            <span>
                                BUY
                            </span>

                            <strong class="buy">
                                ${data.probabilities?.BUY ?? "N/A"}%
                            </strong>

                        </div>


                        <div>

                            <span>
                                HOLD
                            </span>

                            <strong class="hold">
                                ${data.probabilities?.HOLD ?? "N/A"}%
                            </strong>

                        </div>

                    </div>

                </div>

            `;
        }


        await updateStockChart(
            data.symbol
        );


    } catch (error) {

        console.error(
            "Analysis error:",
            error
        );


        if (result) {

            result.innerHTML = `

                <div class="error">

                    <h2>
                        ❌ ERROR
                    </h2>

                    <p>
                        ${error.message}
                    </p>

                </div>

            `;
        }

    } finally {

        if (analyzeBtn) {

            analyzeBtn.disabled =
                false;

            analyzeBtn.textContent =
                "ANALYZE →";
        }
    }
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
// INITIAL LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "AI Stock Market Analyser loaded."
        );


        updateMarketCards();

        updateHeatmap();


        // Refresh market data every 60 seconds

        setInterval(
            function() {

                updateMarketCards();

                updateHeatmap();

            },
            60000
        );

    }
);
