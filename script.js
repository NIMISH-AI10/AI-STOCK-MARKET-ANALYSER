let stockChart = null;

const chartPrices = {
    RELIANCE: [2850, 2880, 2865, 2910, 2930, 2905, 2950],
    TCS: [3980, 4010, 3995, 4050, 4080, 4100, 4120],
    INFY: [1900, 1885, 1895, 1870, 1860, 1875, 1870],
    HDFC: [1650, 1670, 1660, 1685, 1700, 1690, 1710],
    ITC: [450, 455, 452, 448, 445, 442, 440]
};


async function analyzeStock() {

    const input = document.getElementById("stockInput");
    const result = document.getElementById("result");

    const stock = input.value.trim().toUpperCase();

    if (stock === "") {
        result.innerHTML = `
            <div class="analysis-error">
                Please enter a stock symbol.
            </div>
        `;
        return;
    }

    result.innerHTML = `
        <div class="analysis-result">
            <h3>🤖 AI is analyzing ${stock}...</h3>
            <p>Please wait...</p>
        </div>
    `;

    try {

        const response = await fetch(
            `/analyze?stock=${stock}`
        );

        const data = await response.json();

        if (!response.ok) {
            result.innerHTML = `
                <div class="analysis-error">
                    ${data.error}
                </div>
            `;
            return;
        }

        let recommendationClass = "";

        if (data.recommendation === "BUY") {
            recommendationClass = "buy";
        } else if (data.recommendation === "HOLD") {
            recommendationClass = "hold";
        } else {
            recommendationClass = "sell";
        }

        result.innerHTML = `
            <div class="analysis-result">

                <h3>🤖 AI Analysis</h3>

                <h2>${data.name}</h2>

                <p>
                    Stock Symbol:
                    <strong>${stock}</strong>
                </p>

                <div class="analysis-details">

                    <div>
                        <span>Market Sentiment</span>
                        <strong>${data.sentiment}</strong>
                    </div>

                    <div>
                        <span>Recommendation</span>
                        <strong class="${recommendationClass}">
                            ${data.recommendation}
                        </strong>
                    </div>

                    <div>
                        <span>Confidence</span>
                        <strong>${data.confidence}%</strong>
                    </div>

                </div>

            </div>
        `;

        updateStockChart(stock);

    } catch (error) {

        console.error(error);

        result.innerHTML = `
            <div class="analysis-error">
                ❌ Cannot connect to Python backend.
            </div>
        `;
    }
}

async function updateStockChart(stock) {

    const canvas = document.getElementById("stockChart");

    if (!canvas) {
        console.error("Chart canvas not found");
        return;
    }

    try {

        const response = await fetch(
            `price/${stock}`
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(data.error);
            return;
        }

        const labels = data.prices.map(
            item => item.date
        );

        const prices = data.prices.map(
            item => item.price
        );

        if (stockChart !== null) {
            stockChart.destroy();
        }

        stockChart = new Chart(canvas, {

            type: "line",

            data: {

                labels: labels,

                datasets: [{

                    label: stock + " Real Price",

                    data: prices,

                    borderWidth: 3,

                    tension: 0.4,

                    fill: true

                }]

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
            "Error loading real stock data:",
            error
        );

    }
}
console.log("JavaScript loaded successfully.");
