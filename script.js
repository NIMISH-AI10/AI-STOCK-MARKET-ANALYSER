// =====================================================
// AI STOCK MARKET ANALYSER
// FRONTEND JAVASCRIPT
// =====================================================


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let stockChart = null;


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
// DOM ELEMENTS
// =====================================================

const stockInput =
    document.getElementById("stockInput");

const result =
    document.getElementById("result");

const analyzeBtn =
    document.getElementById("analyzeBtn");


// =====================================================
// BACKEND STATUS
// =====================================================

async function checkBackendStatus() {

    const statusElement =
        document.getElementById("backendStatus");

    if (!statusElement) {
        return;
    }


    try {

        const response =
            await fetch(
                "/health",
                {
                    cache: "no-store"
                }
            );


        if (response.ok) {

            statusElement.innerHTML =
                '<span class="status-dot online-dot"></span> BACKEND ONLINE';

            statusElement.style.color =
                "#35d07f";

        }

        else {

            throw new Error(
                "Backend unavailable"
            );

        }

    }

    catch (error) {

        console.error(
            "Backend status error:",
            error
        );


        statusElement.innerHTML =
            '<span class="status-dot offline-dot"></span> BACKEND OFFLINE';

        statusElement.style.color =
            "#ff6b6b";

    }

}


// =====================================================
// ANALYZE STOCK
// =====================================================

async function analyzeStock() {

    if (!stockInput || !result) {
        return;
    }


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
                    Try RELIANCE, TCS, INFY,
                    HDFC or ITC.
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
                Fetching market information
                and generating analysis.
            </p>

            <div style="
                margin-top:18px;
                font-size:0.9rem;
                color:#7d8fa4;
            ">
                🔄 Connecting to backend...
            </div>

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
    // START CHART REQUEST IMMEDIATELY
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
                `/analyze?stock=${encodeURIComponent(stock)}`,
                {
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            throw new Error(

                data.error ||
                "Stock analysis unavailable"

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
                .toLowerCase() === "positive"
        ) {

            sentimentIcon =
                "😊";

        }

        else if (
            data.sentiment &&
            data.sentiment
                .toLowerCase() === "negative"
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
            data.recommendation === "BUY"
        ) {

            recommendationClass =
                "buy";

            recommendationIcon =
                "📈";

        }

        else if (
            data.recommendation === "SELL"
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


                <p style="
                    margin-top:20px;
                    color:#35d07f;
                    font-size:0.75rem;
                ">

                    ✓ Analysis received
                    successfully from Flask backend.

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
                    ⚠ ANALYSIS UNAVAILABLE
                </h3>

                <h2>
                    Unable to analyze ${companyName}
                </h2>

                <p>
                    The backend could not return
                    the requested analysis.
                </p>

                <p style="
                    margin-top:15px;
                    color:#7d8fa4;
                    font-size:0.75rem;
                ">

                    Please check your connection
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
            "Stock chart canvas not found"
        );

        return;

    }


    try {

        console.log(
            `Loading ${stock} chart...`
        );


        // =================================================
        // FETCH PRICE DATA
        // =================================================

        const response =
            await fetch(

                `/price/${encodeURIComponent(stock)}?t=${Date.now()}`,

                {
                    cache: "no-store"
                }

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
                item =>
                    Number(item.price)
            );


        // =================================================
        // DISPLAY NAME
        // =================================================

        let displayName =
            companyName || stock;


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
        // CURRENT PRICE DISPLAY
        // =================================================

        const currentPrice =
            document.getElementById(
                "currentPrice"
            );


        if (
            currentPrice &&
            data.current_price !== null &&
            data.current_price !== undefined
        ) {

            currentPrice.textContent =
                `₹${Number(
                    data.current_price
                ).toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )}`;

        }


        // =================================================
        // CHANGE DISPLAY
        // =================================================

        const changeElement =
            document.getElementById(
                "priceChange"
            );


        if (
            changeElement &&
            data.change_percent !== null &&
            data.change_percent !== undefined
        ) {

            const percentage =
                Number(
                    data.change_percent
                );


            const sign =
                percentage >= 0
                    ? "+"
                    : "";


            const arrow =
                percentage >= 0
                    ? "▲"
                    : "▼";


            changeElement.textContent =
                `${arrow} ${sign}${percentage}%`;


            changeElement.style.color =
                percentage >= 0
                    ? "#35d07f"
                    : "#ff6b6b";

        }


        // =================================================
        // LAST UPDATED
        // =================================================

        const lastUpdated =
            document.getElementById(
                "lastUpdated"
            );


        if (lastUpdated) {

            lastUpdated.textContent =
                `Last updated: ${new Date()
                    .toLocaleTimeString()}`;

        }


        // =================================================
        // DESTROY OLD CHART
        // =================================================

        if (stockChart) {

            stockChart.destroy();

            stockChart = null;

        }


        // =================================================
        // CREATE NEW CHART
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

                        maintainAspectRatio:
                            false,


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

                                beginAtZero:
                                    false,


                                ticks: {

                                    color:
                                        "#71849a",

                                    callback:
                                        function(value) {

                                            return "₹" +
                                                value;

                                        }

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


    // =================================================
    // CHART ERROR
    // =================================================

    catch (error) {

        console.error(
            `Chart error (${stock}):`,
            error
        );


        const chartError =
            document.getElementById(
                "chartError"
            );


        if (chartError) {

            chartError.textContent =
                "⚠ Unable to load market chart. Please try again.";

            chartError.style.display =
                "block";

        }

    }

}


// =====================================================
// QUICK STOCK BUTTON
// =====================================================

function setStock(symbol) {

    if (!stockInput) {

        console.error(
            "Stock input not found"
        );

        return;

    }


    // Set stock
    stockInput.value =
        symbol.toUpperCase();


    // Hide old chart error
    const chartError =
        document.getElementById(
            "chartError"
        );


    if (chartError) {

        chartError.style.display =
            "none";

    }


    // Scroll to analysis
    const analysisSection =
        document.getElementById(
            "analysis"
        );


    if (analysisSection) {

        analysisSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    // Analyze immediately
    analyzeStock();

}


// =====================================================
// STOCK CARD CLICK
// =====================================================

function analyzeCard(symbol) {

    setStock(symbol);

}


// =====================================================
// ENTER KEY SUPPORT
// =====================================================

if (stockInput) {

    stockInput.addEventListener(

        "keydown",

        function(event) {

            if (
                event.key === "Enter"
            ) {

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
            "AI Stock Market Analyser loaded"
        );


        console.log(
            "Flask API connection ready"
        );


        // Check backend
        checkBackendStatus();


        // Check backend periodically
        setInterval(
            checkBackendStatus,
            30000
        );

    }

);
