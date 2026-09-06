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
// UPDATE AI DECISION SIGNAL
// =====================================================

function updateDecisionSignal(data) {

    const decisionSignal =
        document.getElementById("decisionSignal");

    const decisionConfidence =
        document.getElementById("decisionConfidence");


    console.log("Updating AI Decision Signal:", data);


    // Update recommendation
    if (decisionSignal) {

        const recommendation =
            data.recommendation || "N/A";

        decisionSignal.textContent =
            recommendation;

        // Remove previous classes
        decisionSignal.classList.remove(
            "buy",
            "sell",
            "hold"
        );

        // Add correct class
        if (recommendation === "BUY") {

            decisionSignal.classList.add("buy");

        }

        else if (recommendation === "SELL") {

            decisionSignal.classList.add("sell");

        }

        else {

            decisionSignal.classList.add("hold");

        }

    }


    // Update confidence
    if (decisionConfidence) {

        if (
            data.confidence !== undefined &&
            data.confidence !== null
        ) {

            decisionConfidence.textContent =
                `${Number(data.confidence).toFixed(2)}%`;

        }

        else {

            decisionConfidence.textContent =
                "N/A";

        }

    }

}


// =====================================================
// WAIT FOR CHART.JS
// =====================================================

function waitForChartJS() {

    return new Promise((resolve) => {

        if (typeof Chart !== "undefined") {

            resolve();
            return;

        }

        const timer = setInterval(() => {

            if (typeof Chart !== "undefined") {

                clearInterval(timer);
                resolve();

            }

        }, 100);

    });

}


// =====================================================
// WAIT FOR CANVAS
// =====================================================

function waitForCanvas() {

    return new Promise((resolve) => {

        const checkCanvas = () => {

            const canvas =
                document.getElementById("stockChart");

            if (canvas) {

                resolve(canvas);

            }

            else {

                requestAnimationFrame(checkCanvas);

            }

        };

        checkCanvas();

    });

}


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

                <h2>
                    Please enter a stock symbol
                </h2>

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
    // API REQUEST
    // =================================================

    try {

        const response =
            await fetch(
                `/analyze?stock=${encodeURIComponent(stock)}`
            );


        const data =
            await response.json();


        console.log("API RESPONSE:", data);


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
        // UPDATE AI DECISION SIGNAL
        // =================================================

        updateDecisionSignal(data);


        // =================================================
        // UPDATE CHART
        // =================================================

        updateStockChart(
            stock,
            companyName,
            data.price,
            data.date
        );


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

                        <strong
                            class="${recommendationClass}"
                        >

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

            </div>

        `;


        // =================================================
        // UPDATE DECISION SIGNAL AGAIN
        // =================================================
        // This makes sure the decision section remains
        // updated even after #result is rebuilt.

        updateDecisionSignal(data);


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
    companyName,
    currentPrice,
    currentDate
) {

    try {

        await waitForChartJS();


        const canvas =
            await waitForCanvas();


        await new Promise(resolve => {

            requestAnimationFrame(() => {

                requestAnimationFrame(resolve);

            });

        });


        console.log(
            `📊 Loading ${stock} chart...`
        );


        let displayName =
            stockNames[stock] ||
            companyName ||
            stock;


        if (stock === "HDFC") {

            displayName =
                "HDFC Bank";

        }


        const labels = [
            currentDate
        ];

        const prices = [
            Number(currentPrice)
        ];


        console.log(
            `📈 ${stock} prices:`,
            prices
        );


        if (stockChart) {

            stockChart.destroy();

            stockChart = null;

        }


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


        const context =
            canvas.getContext("2d");


        if (!context) {

            console.error(
                "❌ Unable to get canvas context"
            );

            return;

        }


        stockChart =
            new Chart(
                context,
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

                        animation: {

                            duration: 500

                        },

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


        stockChart.update();

        stockChart.resize();


        console.log(
            `🎉 ${displayName} chart created successfully`
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
// TRY STOCK BUTTON
// =====================================================

function setStock(symbol) {

    if (!stockInput) {

        console.error(
            "❌ Stock input not found"
        );

        return;

    }


    stockInput.value =
        symbol.toUpperCase();


    requestAnimationFrame(() => {

        setTimeout(() => {

            analyzeStock();

        }, 500);

    });

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

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "✅ AI Stock Market Analyser loaded"
        );

    }
);


// =====================================================
// CHART.JS READY CHECK
// =====================================================

waitForChartJS().then(() => {

    console.log(
        "📊 Chart.js successfully loaded"
    );

});
