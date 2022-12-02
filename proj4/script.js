MAX_STOCKS = 5; // Maximum stocks in a portfolio
PORTFOLIO = undefined;
BENCHMARK = undefined;
PULL_ATTEMPT = false; // Flag to prevent multiple clicks on API button in pullButtonHandler
COLLECTIONARRAY = [];

window.addEventListener("DOMContentLoaded", initialLoadHander);

function initialLoadHander() {
    const apiButton = document.getElementById("api-button");
    apiButton.addEventListener("click", apiButtonHandler)
    
    const changeAPIbutton = document.getElementById("change-api");
    changeAPIbutton.addEventListener("click", changeAPI);

    let userAPIkey = localStorage.getItem("alphaVantageAPIkey");
    if (userAPIkey) {
        clearScreen();
    }

    let ranges = document.querySelectorAll("input.range-stock");
    for (let i = 0; i < MAX_STOCKS; i++) {
        ranges[i].addEventListener("change", rangeStockHandler);
    }

    const pullButton = document.getElementById("get-data");
    pullButton.addEventListener("click", pullButtonHandler);

    const estimateButton = document.getElementById("port-weight");
    estimateButton.addEventListener("click", estimateButtonHandler)
    
}

function rangeStockHandler() {
    // Get the values from the range element into an array
    let valList = [];
    let ranges = document.querySelectorAll("input.range-stock");
    for (let i = 0; i < PORTFOLIO.numStocks; i++) {
        valList.push(parseFloat(ranges[i].value));
    }
    
    // Create the weighted portfolio array
    let sum = valList.reduce((a, b) => parseFloat(a) + b, 0);
    let weightedW = valList.map(w => w / sum);

    // Add labels
    let labels = document.getElementsByClassName("label-s-range");
    for (let i = 0; i < PORTFOLIO.numStocks; i++) {
        let val = weightedW[i];
        if (isNaN(val)) {
            val = 0;
        }
        labels[i].textContent = (val * 100).toFixed(2) + '%';
    }
}

function clearScreen() {
    document.getElementById("cover").style.display = "none";
    document.getElementById("wrapper").style.display = "grid";
}

function changeAPI() {
    document.getElementById("cover").style.display = "flex";
    document.getElementById("wrapper").style.display = "none";    
}

function apiButtonHandler() {
    const apiText = document.getElementById("api").value;
    localStorage.setItem("alphaVantageAPIkey", apiText);
    
    clearScreen();
}

function pullButtonHandler() {
    let selections = getInputTickers();
    // Prevents mutliple calls of the API button 
    if (!PULL_ATTEMPT) {
        pullData(selections);
        PULL_ATTEMPT = true;
        setTimeout(resetPullAttempt, 2500);
    }
}

function resetPullAttempt() {
    PULL_ATTEMPT = false;
}

function getInputTickers() {
    // called by the pullButtonHandler
    let boxes = document.querySelectorAll("input.ticker-box");
    let selections = [];
    for (let box of boxes) {
        if (box.value) {
            selections.push(box.value.toUpperCase().trim());
        }
    }
    return selections;
}

function pullData(selections) {
    if (selections.length == 0) {
        // If no data is given, the blankDataHandler is called to use offline data.
        PORTFOLIO = blankDataHandler();
    } else {
        for (let ticker in selections) {
            if (selections[ticker]) {
                (requestTicker(selections[ticker]))
            }
        }
        setTimeout(addDataToObject, 2000)
    }
}

function addDataToObject() {
    try {
        PORTFOLIO = new Portfolio(true, COLLECTIONARRAY)
        addDataToPage(PORTFOLIO.nameArray)
    } catch {
        blankDataHandler();
    }
}

// Adapted from zyBooks
async function requestTicker(ticker) {
    let apiKey = localStorage.getItem("alphaVantageAPIkey");
    let requestURL = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}`;
    fetch(requestURL)
        .then(response => {
        console.log("status is " + response.status);
            return response.text();
        })
        .then(html => COLLECTIONARRAY.push(JSON.parse(html)))
        .catch(error => console.log("Request failed", error));
}

function blankDataHandler() {
    alert(`
Problem with data or insufficient data provided.
Running model with saved historical data.
Note: only 5 request a minute, 500 a day for each API key.
    `)
    // This saved data comes from the savedStocks file populated from previous API calls.
    const savedData = [AAPL, JNJ, RTX, TRV, TXN];
    PORTFOLIO = new Portfolio(true, savedData);
    addDataToPage(PORTFOLIO.nameArray);
    return PORTFOLIO;
}

function addDataToPage(portNameArray) {
    // add range elements
    for (let ticker in portNameArray) {
        document.getElementById("range-d" + ticker).style.display = "grid";
        document.getElementById("label-range-sn" + ticker).textContent = portNameArray[ticker];
    } 
    
    // hide the pull div
    const tickerPick = document.getElementById("stock-picker");
    tickerPick.style.display = "none";

    // unhide the weight div
    const portDiv = document.getElementById("port-div");
    portDiv.style.display = "flex";
}

function estimateButtonHandler() {
    let omega = new Matrix(getWeights());
    let mu = calcPortReturns(omega);
    let sigma = calcPortVariance(omega); 
    let sharpe = calcSharpeRatio(sigma, mu);

    populateResults(omega, mu, sigma, sharpe);
}

function populateResults(omega, mu, sigma, sharpe) {
    const displayDiv = document.getElementById("results");
    displayDiv.style.display = "flex";

    const pageLink = document.getElementById("refresh-page");
    pageLink.style.display = "inline";

    const muText = document.getElementById("mu-res");
    muText.innerHTML = '&mu; = ' + toPercent(mu, 3);

    const sigmaText = document.getElementById("si-res");
    sigmaText.innerHTML = '&sigma; = ' + toPercent(sigma, 2);

    const sharpeText = document.getElementById("sh-res");
    sharpeText.innerHTML = 'Sharpe Ratio: ' + sharpe.toFixed(4);

    const coVarText = document.getElementById("coVar");
    coVarText.innerHTML = PORTFOLIO.printHTMLtable()

    // SP500 Benchmark:
    BENCHMARK = spyderDataHandler();
    let spyderMu = BENCHMARK[0].mu;
    const muBM = document.getElementById("mu-bm");
    muBM.innerHTML = '&mu; = ' + toPercent(spyderMu, 3);

    let spyderDev = BENCHMARK.coVar.matrixArray[0][0] ** 0.5;
    const sigmaBM = document.getElementById("si-bm");
    sigmaBM.innerHTML = '&sigma; = ' + toPercent(spyderDev, 2);

    const sharpeBM = document.getElementById("sh-bm");
    sharpeBM.innerHTML = 'Sharpe Ratio: ' + calcSharpeRatio(spyderDev, spyderMu).toFixed(4);

    // draw chart
    fromGoogle(makeChartDataArray(mu, sigma, spyderMu, spyderDev))
}

function toPercent(number, places = 2) {
    return (number * 100).toFixed(places) + '%';
}

function getWeights() {
    // Get the values from the range element into an array
    let valList = [];
    let ranges = document.querySelectorAll("input.range-stock");
    for (let i = 0; i < PORTFOLIO.numStocks; i++) {
        valList.push(parseFloat(ranges[i].value));
    }
    let sum = valList.reduce((a, b) => parseFloat(a) + b, 0);
    // If you zero all the portfolio values, you'll get zero, not NaN
    let weightedW = valList.map(w => sum == 0 ? 0 : w / sum);
    let omega = [];
    omega.push(weightedW)
    return omega;
}

function calcPortReturns(omega) {
    let muPort = omega.dotProduct(PORTFOLIO.muMatrix)
    // dot product will reduce the matrix to one element
    return muPort.matrixArray[0][0];
}

function calcPortVariance(omega) {
    // w * S * w' 
    let firstHalf = omega.dotProduct(PORTFOLIO.coVar);
    omega.transpose();
    let sigmaPort = firstHalf.dotProduct(omega);
    omega.transpose();
    return sigmaPort.matrixArray[0][0] ** 0.5;
}

function calcSharpeRatio(sigma, mu) {
    // Assuming that risk-free rate is zero, because I'm not calculating it
    return mu / sigma;
}

function spyderDataHandler() {
    let spy = new Portfolio(true, [SPY], PORTFOLIO.maxMonths);
    return spy;
}

// Make the chart:

function normalPDF(val, mu, sigma) {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.E ** ((-1 / 2) * ((val - mu) / sigma) ** 2);
}

function makeChartDataArray(portMu, portSigma, benchMu, benchSigma) {
    let minVal = benchMu - 3 * benchSigma;
    let maxVal = benchSigma + 3 * benchSigma;
    dataArray = [['Return', 'Portfolio', 'S&P 500']];
    for (let i = minVal; i < maxVal; i += benchSigma / 10) {
        row = [toPercent(i), normalPDF(i, portMu, portSigma), normalPDF(i, benchMu, benchSigma)];
        dataArray.push(row);
    }
    return dataArray;
}

function fromGoogle(arrData) {

    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
    var data = google.visualization.arrayToDataTable(arrData);

    var options = {
        title: 'Expected Distribution of Returns',
        hAxis: {title: 'Percent Return'},
        vAxis: {minValue: 0, ticks: []},
        backgroundColor: '#732634',
        colors: ['#010d00', '#EAEAEA']
    };

    var chart = new google.visualization.AreaChart(document.getElementById('chart-div'));
    chart.draw(data, options);
    }
}