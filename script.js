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

            } else {

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

            <h3>🤖 AI ANALYSIS</h3>

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
    // START CHART
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

    try {

        // =================================================
        // WAIT FOR CHART.JS
        // =================================================

        await waitForChartJS();


        // =================================================
        // WAIT FOR CANVAS
        // =================================================

        const canvas =
            await waitForCanvas();


        // =================================================
        // WAIT FOR BROWSER RENDER
        // =================================================

        await new Promise(resolve => {

            requestAnimationFrame(() => {

                requestAnimationFrame(resolve);

            });

        });


        console.log(
            `📊 Loading ${stock} chart...`
        );


        // =================================================
        // GET STOCK DATA
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
        // FORCE CORRECT COMPANY NAME
        // =================================================

        let displayName =
            stockNames[stock] || companyName || stock;


        // HDFC FIX

        if (stock === "HDFC") {

            displayName =
                "HDFC Bank";

        }


        // =================================================
        // DESTROY PREVIOUS CHART
        // =================================================

        if (stockChart) {

            stockChart.destroy();

            stockChart = null;

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


        // =================================================
        // FORCE CHART UPDATE
        // =================================================

        stockChart.resize();

        stockChart.update();


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
            "Stock input not found"
        );

        return;

    }


    // =================================================
    // SET STOCK
    // =================================================

    stockInput.value =
        symbol.toUpperCase();


    // =================================================
    // SCROLL TO ANALYSIS
    // =================================================

    const analysisSection =
        document.getElementById("analysis");


    if (analysisSection) {

        analysisSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    // =================================================
    // WAIT FOR RENDER
    // =================================================

    requestAnimationFrame(() => {

        setTimeout(() => {

            analyzeStock();

        }, 300);

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

        console.log(
            "✅ Chart.js ready"
        );

    }
);


// =====================================================
// INITIAL CHART.JS CHECK
// =====================================================

waitForChartJS().then(() => {

    console.log(
        "📊 Chart.js successfully loaded"
    );

});
