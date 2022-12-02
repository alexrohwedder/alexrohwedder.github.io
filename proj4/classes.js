class Portfolio {
    constructor(offlineMode=false, arrData=false, maxMonths=60) {
        this.arrData = arrData;
        this.numStocks = 0;
        this.maxMonths = this.findMaxMonths(maxMonths); // 60 is the standard 5 years, and is the maximum test period
        this.nameArray = [];
        if (offlineMode) {
                // arrData represents the collection of all stored offline data
                // This allows the portfolio to work even if the API functionality dies
                for (let stock of arrData) {
                    let name = stock["Meta Data"]["2. Symbol"];
                    let prices = this.makePriceArray(stock);
                    this[this.numStocks] = new Stock(name, prices, this.maxMonths);
                    this.numStocks++;
                    this.nameArray.push(name);
                }
        }
        this.coVar = this.makeCovar();
        this.muMatrix = this.makeMuMatrix()
    }

    findMaxMonths (initialMax) {
        let maxMonths = initialMax;
        for (let stock of this.arrData) {
            let history = Object.keys(stock["Monthly Adjusted Time Series"]);
            // adjust max months to minimum of available data
            let len = history.length - 1;
            maxMonths = maxMonths > len ? len : maxMonths;
        }
        return maxMonths;
    }

    makePriceArray(stock) {
        let prices = [];
        let history = Object.keys(stock["Monthly Adjusted Time Series"]);
        history.slice(0, this.maxMonths + 1);
        for (let time of history) {
            prices.push(stock["Monthly Adjusted Time Series"][time]["5. adjusted close"]);
        }
        return prices;
    }

    makeCovar() {
        let numStocks = this.numStocks;
        // create a matrix object of the correct size
        let vCv = new Matrix(arrOfZeros(numStocks, numStocks));
        // for each stock pair (n^2) calculates the variance or covariance
        for (let i = 0; i < numStocks; i++) {
            for (let j = 0; j < numStocks; j++) {
                vCv.matrixArray[j][i] = this.calcCovariance(this[i], this[j]);
            }
        }
        return vCv;
    }

    calcCovariance(iStock, jStock) {
        // Calculates the returns for two stocks in the portfolio
        let iReturns = iStock.arrReturns;
        let iAvg = iStock.mu;
        let jReturns = jStock.arrReturns;
        let jAvg = jStock.mu;

        let sum = 0;
        for (let t in iReturns) {
            sum += (iReturns[t] - iAvg) * (jReturns[t] - jAvg);
        }
    return sum / (iReturns.length - 1);
    }

    makeMuMatrix() {
        // Creates an array of stock returns
        let muArray = [];
        for (let ticker in this.nameArray) {
            muArray.push([this[ticker].mu])
        }
        let muMatrix = new Matrix(muArray)
        return muMatrix;
    }

    printHTMLtable() {
        // Nicely formatted HTML string of matrix values
        let coVarMatrix = this.coVar
        let row = '<tr>'; 
        for (let j = 0; j < coVarMatrix.rows + 1; j++) {
            for (let i = 0; i < coVarMatrix.cols + 1; i++) {
                if (i == 0 && j == 0) {
                    row += '<td> ' + ' ' + '</td>';
                } else if (i == 0) {
                    row += '<th> ' + this.nameArray[j - 1] + ' </th>';
                } else if (j == 0) {
                    row += '<th> ' + this.nameArray[i -1] + ' </th>';
                } else {
                    row += '<td> ' + (coVarMatrix.matrixArray[j - 1][i - 1].toFixed(4)) + ' </td>';
                }
            }
            row += '</tr>';
        }
        return `<table>${row}</table>`
    }
}

class Stock {
    constructor(name, prices, months) {
        this.ticker = name;
        this.prices = prices;
        this.numMonths = months;
        this.arrReturns = this.makeRetunsArray(this.prices);
        this.mu = this.calcAverage(this.arrReturns);
    }

    calcAverage(arrRetuns) {
        let sum = arrRetuns.reduce((a, b) => a + b, 0);
        return sum / this.numMonths;
    }

    makeRetunsArray(arrPrices) {
        let arrReturns = [];
        for (let i = 0; i < this.numMonths; i++) {
            arrReturns.push(
            this.calcReturn(arrPrices[i], arrPrices[i + 1])
            );
        }
        return arrReturns;
    }

    calcReturn(a, b) {
        let rate = (a - b) / b;
        return rate;
    }
}

class Matrix {
    constructor(arrOfArrays) {
    this.rows = arrOfArrays.length;
    this.cols = arrOfArrays[0].length;
    this.matrixArray = arrOfArrays;
    }

    dotProduct(bMatrix) {
        // A * bMatrix 
        // NOTE: MATRIX MULTIPLICATION IS NOT COMMUTATIVE 
        // if multiplication is valid:
        if (this.cols === bMatrix.rows) {
            // make a new empty matrix of 0's:
            let resMatrix = [];
            for (let y = 0; y < this.rows; y++) {
                let newRowArray = []
                for (let x = 0; x < bMatrix.cols; x++) {
                    newRowArray.push(0);
                }
                resMatrix.push(newRowArray);
            }
            resMatrix = new Matrix(resMatrix);
            // Add values to the correct position in the resMatrix
            for (let j = 0; j < resMatrix.rows; j++) {
                for (let i = 0; i < resMatrix.cols; i++) {
                    let sumProd = 0;
                    for (let r = 0; r < this.cols; r++) {
                        sumProd += this.matrixArray[j][r] * bMatrix.matrixArray[r][i];
                    }
                    resMatrix.matrixArray[j][i] = sumProd;
                }
            }
                return resMatrix;
            // If matrix multiplication can't work, return undefined.
        } else {
            return undefined;
        }
    }

    transpose() {
        // Matrix transpose
        let newMatrixArray = [];
        for (let i = 0; i < this.cols; i++) {
            let newRowArray = [];
            for (let j = 0; j < this.rows; j++) {
                newRowArray.push(this.matrixArray[j][i]);
            }
            newMatrixArray.push(newRowArray);
        }
        let oldRows = this.rows;
        this.rows = this.cols;
        this.cols = oldRows;
        this.matrixArray = newMatrixArray;
    }

    printMatrix() {
        // Nicely formatted string of matrix values
        // Primarily for debugging
        var line = '';
        for (let j = 0; j < this.rows; j++) {
            for (let i = 0; i < this.cols; i++) {
                line += this.matrixArray[j][i].toFixed(6) + ' ';
                }
            line += '\n';
        }
        return line;
    }

}

function arrOfZeros(x, y, k=0) {
    // creates an array y long of arrays x long
    let arrRes = [];
    for (let j = 0; j < y; j++) {
        let newRow = [];
        for (let i = 0; i < x; i++) {
            newRow.push(k);
        }
        arrRes.push(newRow);
    }
    return arrRes;
}
