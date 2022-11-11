
let BONDCOUNTER = 1;
let BONDS = {};
const MAXLENGTH = 100;

window.addEventListener("DOMContentLoaded", initialLoadHandler);

function initialLoadHandler() {

  let runButton = document.getElementById('run-button');
  runButton.addEventListener("click", runButtonHandler);

  let resetButton = document.getElementById('reset-button');
  resetButton.addEventListener("click", resetButtonHandler);

  const addButton = document.getElementById('add-cf-button');
  addButton.addEventListener("click", addButtonHandler);

  const cfResetButton = document.getElementById('reset-cf-button');
  cfResetButton.addEventListener("click", cfResetButtonHandler);
}

alert('Not done with this page. Try the animation link at the top of the page.')

function runButtonHandler() {
  let bondNumbers = Object.getOwnPropertyNames(BONDS); 
  // NEED TO ADD CATCH FOR EMPTY DATA
  let dataArray = createDataArray()
  console.log(dataArray)
  fromGoogleDrawChart(dataArray,'1','2')
  console.log(newtonRaphsonMethod(calcNPV, sumCF(dataArray)))
}

function resetButtonHandler() {
  for (let bond = 1; bond <= BONDCOUNTER; bond++) {
    deleteButtonHandler(bond);
  }
  BONDCOUNTER = 1;
}

function addButtonHandler() {

  // This function runs off of the 'add bond' button
  // It creates a div with the correct values and places it into the cashflow-holder div
  // Validation of data is done with the addValidator function
  // let dataToAdd = document.getElementById("bond-add-div");

  let toAdd = {};

  // Information from form is collected into our object:
  toAdd.price = parseFloat(document.getElementById("price-0").value);
  toAdd.face = parseFloat(document.getElementById("face-0").value);
  toAdd.coupon = parseFloat(document.getElementById("coupon-0").value);
  toAdd.maturity = parseFloat(document.getElementById("length-0").value);
  toAdd.bid = document.getElementById("bid-0").checked;
  // alert(Object.getOwnPropertyNames(toAdd) + ' ' + toAdd.bid);

  if (validateInput(toAdd)) {
    addBond(toAdd);
  }
} 

function validateInput(add) {
  let correctEntry = true;
  let errorString = ''
  if (add.price < 0 || isNaN(add.price)) {
    correctEntry = false;
    errorString += `You entered a price of ${add.price}. Please enter a positive number!`;
  }

  if (add.face < 0 || isNaN(add.face)) {
    correctEntry = false;
    errorString += `\nYou entered a face value of ${add.face}. Please enter a positive number!`;
  }
  
  if (add.coupon < 0 || isNaN(add.coupon)) {
    correctEntry = false;
    errorString += `\nYou entered a coupon value of ${add.coupon}. Please enter a positive number!`;
  }

  if (add.maturity <= 0 || add.maturity > MAXLENGTH || isNaN(add.maturity)) {
    correctEntry = false;
    errorString += `\nYou entered a maturity of ${add.maturity}. Please enter a positive number less than ${MAXLENGTH + 1}!`
  }

  if (errorString) {
    alert(errorString + '\n\nIf this is too hard for you, try using the scenario buttons to the right...');
  }
  return correctEntry;
}

function deleteButtonHandler(idNo) {
  let toDelete = document.getElementById('cf-' + idNo);
  if (toDelete != null) {
    toDelete.parentNode.removeChild(toDelete);
    delete BONDS[idNo]
  };
}

function addBond(toAdd) {
  
  // Need to do a sign change if bid/offer
  if (toAdd.bid) {
    // Buying
    toAdd.price *= -1;
  } else {
    // Selling
    toAdd.face *= -1;
  }

  toAdd.coupon /= 100;

  // Add to global object
  addBondToObject(toAdd);

  // Generate HTML
  let typeOfBond = 'Offer'
  if (toAdd.bid) {
    typeOfBond = 'Bid'
  }

  let addHTML = document.createElement("div");
  addHTML.className = "cashflow" 
  addHTML.id = "cf-" + BONDCOUNTER;
  addHTML.innerHTML = `
    <div class="div-cf-title">
      <h5>Bond # ${BONDCOUNTER}</h5>
      <button class="delete-cf-button" id="del${BONDCOUNTER}" onclick="deleteButtonHandler(${BONDCOUNTER});">-</button>
    </div>
    <div class="div-cf-data">
      <p>${typeOfBond}</p>
      <p id="price-${BONDCOUNTER}">Price: \$${toAdd.price}</p>
      <p>Coupon: ${toAdd.coupon * 100}%</p>
      <p>Face value: \$${toAdd.face}</p>
      <p>Maturity: ${toAdd.maturity} year(s)</p>
    </div>`;

  // add to DOM
  BONDCOUNTER++;
  let cashflowHolder = document.getElementById("cashflow-holder")
  cashflowHolder.appendChild(addHTML)

  // Clear form
  clearBondDef()
}


function cfResetButtonHandler() {
  clearBondDef()
}

function addBondToObject(add) {
  BONDS[BONDCOUNTER] = add
}


function clearBondDef() {
  document.getElementById("price-0").value = '';
  document.getElementById("face-0").value = '';
  document.getElementById("coupon-0").value = '';
  document.getElementById("length-0").value = '';
  document.getElementById("bid-0").checked = true;
}


function createDataArray() {
  let dataArray = [];
  let keys = Object.getOwnPropertyNames(BONDS);
  dataArray.push(keys)


  timeline = makeTimeArray();

  
  for (let period of timeline) {
    let arrPeriod = [period]
    for (let key of keys) {
      let bond = BONDS[key];
      let addedMoneyThisPeriodForThisBond = 0
      
      // If zero period, add price
      if (period == 0) {
        addedMoneyThisPeriodForThisBond += bond.price;
      }

      // If bond is matured, add face value
      if (period == bond.maturity) {
        addedMoneyThisPeriodForThisBond += bond.face
      } else {
        addedMoneyThisPeriodForThisBond += 0
      }

      // if bond is in payout range, add coupon
      if (parseFloat(period) > 0 && parseFloat(period) <= bond.maturity) {
        addedMoneyThisPeriodForThisBond += bond.coupon / 2 * bond.face;
      } 
      
    arrPeriod.push(addedMoneyThisPeriodForThisBond);
    }
    dataArray.push(arrPeriod);
  }
  dataArray[0].unshift('Year')
  return dataArray; 

}



function sumCF(dataArray) {
  let cfArray = [];
  
  for (let t = 1; t < dataArray.length; t++) {
    let totalCF = 0;
    for (let cf = 1; cf < dataArray[t].length; cf++) {
      totalCF += dataArray[t][cf];
    }
    cfArray.push(totalCF);
  }

  return cfArray;
}

function discountArray(n, r) {
  arrDiscount = [];
  for (let t = 0; t < n; t++) {
    arrDiscount.push(1 / ((1 + r) ** t));
  }

  return arrDiscount;
}


function calcNPV(arrBond, r) {
  let sum = 0;
  let arrDisc = discountArray(arrBond.length, r);
  for (i = 0; i < arrBond.length; i++) {
    sum += arrBond[i] * arrDisc[i];
  }
  return sum;
}

function newtonRaphsonMethod(foo, arrBond) {
  // initial guess
  const maxAttempts = 1000;
  const primeAdjust = .00001;
  const epsilon = 0.0009;
  const r0 = .08;

  let bestGuess = [r0, foo(arrBond, r0)];
  
  for (let trial = 0; trial < maxAttempts; trial++) {
    let fooPrime = (foo(arrBond, r0 + primeAdjust) - foo(arrBond, r0 - primeAdjust));
    fooPrime /= (2 * primeAdjust);

    let newGuess = bestGuess[0] - (bestGuess[1] / fooPrime)
    // console.log(`newGuess: ${newGuess}, bestGuess: ${bestGuess}`)
    if (foo(addBond, newGuess) < epsilon) {
      return convertSemiAnnualToEAR(newGuess);
    } else {
      bestGuess[0] = newGuess;
      bestGuess[1] = foo(arrBond, newGuess)
    }
  }
  return convertSemiAnnualToEAR(bestGuess[0]);
}

function convertSemiAnnualToEAR(semiRate) {
  return (semiRate + 1) ** 2 - 1;
}

/* Debug */

// let arrBond = [
//   -985, 30, 30, 30, 30, 30, 30, 30, 1030
// ];

// console.log(
//   newtonRaphsonMethod(calcNPV, arrBond) // ~ 0.06534668
// );



function makeTimeArray() {
  // Returns an array with the semi-annual strings notation
  // 2 years -> [0.0, 0.5, 1.0, 1.5, 2.0]
  
  length = getLongestMaturity();
  arrTimeline = [];
  for (let i = 0; i <= length; i += 0.5) {
    arrTimeline.push(i.toFixed(1).toString());
  }
  return arrTimeline;

}


function getLongestMaturity() {
  let max = 0;
  for (let bond of Object.getOwnPropertyNames(BONDS)) {
    if (parseFloat(BONDS[bond].maturity) > max) {
      max = BONDS[bond].maturity;
    }
  }
  return max
}



// This function is from google charts, I did not write this.
function fromGoogleDrawChart(arrChartData, chartTitle, chartSubTitle) {
  google.charts.load('current', {'packages':['bar']});
  google.charts.setOnLoadCallback(drawChart);
  function drawChart() {
    var data = google.visualization.arrayToDataTable(arrChartData);

    var options = {
      isStacked: true,
      height: 500,
      chart: {
      title: chartTitle,
      subtitle: chartSubTitle,
        }
      };

    var chart = new google.charts.Bar(document.getElementById('columnchart_material'));
    chart.draw(data, google.charts.Bar.convertOptions(options));
    }
}
