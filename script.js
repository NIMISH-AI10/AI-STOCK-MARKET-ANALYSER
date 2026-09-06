const stockInput = document.getElementById("stockInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");
const stockChartCanvas = document.getElementById("stockChart");

// ==============================
// API URL
// ==============================

const API_URL =
"https://ai-stock-market-analyser-1-gfsd.onrender.com";

// ==============================
// STOCK NAMES
// ==============================

const stockNames = {
RELIANCE: "Reliance Industries",
TCS: "Tata Consultancy Services",
INFY: "Infosys",
HDFC: "HDFC Bank",
ITC: "ITC Limited"
};

// ==============================
// AI DECISION SIGNAL
// ==============================

function updateDecisionSignal(data) {

```
const decisionSignal =
    document.getElementById("decisionSignal");

const decisionConfidence =
    document.getElementById("decisionConfidence");

console.log(
    "Updating AI Decision Signal:",
    data
);

if (decisionSignal) {

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
}

if (decisionConfidence) {

    if (
        data.confidence !== undefined &&
        data.confidence !== null
    ) {

        decisionConfidence.textContent =
            `${Number(data.confidence).toFixed(2)}%`;

    } else {

        decisionConfidence.textContent =
            "N/A";
    }
}
```

}

// ==============================
// WAIT FOR CHART.JS
// ==============================

function waitForChartJS() {

```
return new Promise((resolve) => {

    if (typeof Chart !== "undefined") {

        resolve();

        return;
    }

    const interval =
        setInterval(() => {

            if (typeof Chart !== "undefined") {

                clearInterval(interval);

                resolve();
            }

        }, 100);
});
```

}

// ==============================
// WAIT FOR CANVAS
// ==============================

function waitForCanvas() {

```
return new Promise((resolve) => {

    const check =
        setInterval(() => {

            const canvas =
                document.getElementById("stockChart");

            if (canvas) {

                clearInterval(check);

                resolve(canvas);
            }

        }, 100);
});
```

}

// ==============================
// ANALYZE STOCK
// ==============================

async function analyzeStock(stock) {

```
stock =
    stock.trim().toUpperCase();

if (!stock) {

    alert("Please enter a stock symbol.");

    return;
}

console.log(
    "Analyzing stock:",
    stock
);

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

    console.log(
        "API response status:",
        response.status
    );

    if (!response.ok) {

        let errorMessage =
            "Unable to analyze stock.";

        try {

            const errorData =
                await response.json();

            if (errorData.error) {

                errorMessage =
                    errorData.error;
            }

        } catch (e) {

            console.log(
                "Could not read error response."
            );
        }

        throw new Error(errorMessage);
    }

    const data =
        await response.json();

    console.log(
        "API data:",
        data
    );

    updateDecisionSignal(data);

    // ==============================
    // DISPLAY RESULT
    // ==============================

    if (result) {

        result.innerHTML = `

            <div class="stock-result">

                <h2>
                    ${data.name || stock}
                </h2>

                <p>
                    Symbol:
                    <strong>
                        ${data.symbol || stock}
                    </strong>
                </p>

                <p>
                    Current Price:
                    <strong>
                        ₹${data.price ?? "N/A"}
                    </strong>
                </p>

                <p>
                    Recommendation:
                    <strong>
                        ${data.recommendation || "N/A"}
                    </strong>
                </p>

                <p>
                    Sentiment:
                    <strong>
                        ${data.sentiment || "N/A"}
                    </strong>
                </p>

                <p>
                    Confidence:
                    <strong>
                        ${
                            data.confidence !== undefined
                                ? Number(data.confidence).toFixed(2)
                                : "N/A"
                        }%
                    </strong>
                </p>

                <p>
                    Date:
                    <strong>
                        ${data.date || "N/A"}
                    </strong>
                </p>

                <div class="probabilities">

                    <p>
                        SELL:
                        <strong>
                            ${data.probabilities?.SELL ?? "N/A"}%
                        </strong>
                    </p>

                    <p>
                        HOLD:
                        <strong>
                            ${data.probabilities?.HOLD ?? "N/A"}%
                        </strong>
                    </p>

                    <p>
                        BUY:
                        <strong>
                            ${data.probabilities?.BUY ?? "N/A"}%
                        </strong>
                    </p>

                </div>

            </div>
        `;
    }

    // ==============================
    // UPDATE AI SIGNAL
    // ==============================

    updateDecisionSignal(data);

    // ==============================
    // UPDATE CHART
    // ==============================

    updateStockChart(data);

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
                    ${error.message || "Failed to fetch"}
                </p>

                <p>
                    Please check the stock symbol
                    and try again.
                </p>

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
```

}

// ==============================
// UPDATE STOCK CHART
// ==============================

async function updateStockChart(data) {

```
try {

    await waitForChartJS();

    const canvas =
        await waitForCanvas();

    if (!canvas) {

        console.log(
            "Chart canvas not found."
        );

        return;
    }

    const ctx =
        canvas.getContext("2d");

    if (window.stockChartInstance) {

        window.stockChartInstance.destroy();
    }

    const price =
        Number(data.price);

    if (isNaN(price)) {

        console.log(
            "Invalid price for chart."
        );

        return;
    }

    window.stockChartInstance =
        new Chart(ctx, {

            type: "line",

            data: {

                labels: [
                    data.date || "Current"
                ],

                datasets: [

                    {

                        label:
                            `${data.symbol} Price`,

                        data: [
                            price
                        ],

                        tension: 0.3,

                        fill: false
                    }

                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

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
        "Chart error:",
        error
    );
}
```

}

// ==============================
// SET QUICK STOCK
// ==============================

function setStock(stock) {

```
if (stockInput) {

    stockInput.value =
        stock;
}

analyzeStock(stock);
```

}

// ==============================
// ENTER KEY
// ==============================

if (stockInput) {

```
stockInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            analyzeStock(
                stockInput.value
            );
        }
    }
);
```

}

// ==============================
// ANALYZE BUTTON
// ==============================

if (analyzeBtn) {

```
analyzeBtn.addEventListener(
    "click",
    function () {

        analyzeStock(
            stockInput.value
        );
    }
);
```

}

// ==============================
// PAGE LOAD
// ==============================

document.addEventListener(
"DOMContentLoaded",
function () {

```
    console.log(
        "AI Stock Market Analyser loaded."
    );

    console.log(
        "API URL:",
        API_URL
    );
}
```

);
