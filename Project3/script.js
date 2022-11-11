
let BONDCOUNTER = 1;
let BONDS = {};
const MAXLENGTH = 100;

window.addEventListener("DOMContentLoaded", initialLoadHandler);

function initialLoadHandler() {

  const runButton = document.getElementById('run-button');
  runButton.addEventListener("click", runButtonHandler);

  const resetButton = document.getElementById('reset-button');
  resetButton.addEventListener("click", resetButtonHandler);

  const addButton = document.getElementById('add-cf-button');
  addButton.addEventListener("click", addButtonHandler);

  const cfResetButton = document.getElementById('reset-cf-button');
  cfResetButton.addEventListener("click", cfResetButtonHandler);

  const cfRandomButton = document.getElementById('random-cf-button');
  cfRandomButton.addEventListener("click", randomButtonHandler); 
}

function runButtonHandler() {
  // NEED TO ADD CATCH FOR EMPTY DATA
  if (BONDCOUNTER > 1) {
    let dataArray = createDataArray();
    fromGoogleDrawChart(dataArray,'1','2');
  }
}

function resetButtonHandler() {
  for (let bond = 1; bond <= BONDCOUNTER; bond++) {
    deleteButtonHandler(bond);
  }
  BONDCOUNTER = 1;
}


function randomButtonHandler() {
  cfResetButtonHandler();

  document.getElementById("price-0").value = getRandomInt(2000, 0);
  document.getElementById("face-0").value = getRandomInt(2000, 0);
  document.getElementById("coupon-0").value = (Math.random() * 20).toFixed(2);
  document.getElementById("length-0").value = getRandomInt(20, 1);
  if ((Math.random() > 0.5)) {
    document.getElementById("bid-0").checked = true;
    document.getElementById("offer-0").checked = false;
  } else {
    document.getElementById("bid-0").checked = false;
    document.getElementById("offer-0").checked = true;
  };

}

function deleteButtonHandler(idNo) {
  let toDelete = document.getElementById('cf-' + idNo);
  if (toDelete != null) {
    toDelete.parentNode.removeChild(toDelete);
    delete BONDS[idNo];
  };
}

function cfResetButtonHandler() {
  clearBondDef();
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
  addHTML.className = "cashflow";
  addHTML.id = "cf-" + BONDCOUNTER;
  addHTML.innerHTML = `
    <div class="div-cf-title">
      <h5>Bond # ${BONDCOUNTER}</h5>
      <button class="delete-cf-button" id="del${BONDCOUNTER}" onclick="deleteButtonHandler(${BONDCOUNTER});">-</button>
    </div>
    <div class="div-cf-data">
      <p>${typeOfBond}</p>
      <p id="price-${BONDCOUNTER}">Price: \$${toAdd.price}</p>
      <p>Coupon: ${(toAdd.coupon * 100).toFixed(2)}%</p>
      <p>Face value: \$${toAdd.face}</p>
      <p>Maturity: ${toAdd.maturity} year(s)</p>
    </div>`;

  // add to DOM
  BONDCOUNTER++;
  let cashflowHolder = document.getElementById("cashflow-holder");
  cashflowHolder.appendChild(addHTML);

  // Clear form
  clearBondDef();
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

// Creates the table of data formatted for google charts
function createDataArray() {
  let dataArray = [];
  let keys = Object.getOwnPropertyNames(BONDS);
  dataArray.push(keys)

  timeline = makeTimeArray();

  for (let period of timeline) {
    let arrPeriod = [period];
    for (let key of keys) {
      let bond = BONDS[key];
      let addedMoneyThisPeriodForThisBond = 0;
      
      // If zero period, add price
      if (period == 0) {
        addedMoneyThisPeriodForThisBond += bond.price;
      }

      // If bond is matured, add face value
      if (period == bond.maturity) {
        addedMoneyThisPeriodForThisBond += bond.face;
      } else {
        addedMoneyThisPeriodForThisBond += 0;
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
  return max;
}

/*
  The folowing section caluculates the IRR.
  It's totally broken for some situations.
  I may fix it later.
*/

// // https://en.wikipedia.org/wiki/Newton's_method
// function newtonRaphsonMethod(foo, arrBond) {
//   const maxAttempts = 10000;
//   const primeAdjust = .00001;
//   const epsilon = 1;
//   const r0 = .10;

//   let bestGuess = [r0, foo(arrBond, r0)];
  
//   for (var trial = 0; trial < maxAttempts; trial++) {
//     let fooPrime = (foo(arrBond, r0 + primeAdjust) - foo(arrBond, r0 - primeAdjust));
//     fooPrime /= (2 * primeAdjust);

//     let newGuess = bestGuess[0] - (bestGuess[1] / fooPrime)
//     // console.log(`newGuess: ${newGuess}, bestGuess: ${bestGuess}`)
//     if (foo(addBond, newGuess) < epsilon) {
//       return convertSemiAnnualToEAR(newGuess);
//     } else {
//       bestGuess[0] = newGuess;
//       bestGuess[1] = foo(arrBond, newGuess)
//     }
//   }
//   console.log('best ' + bestGuess[0] + ' ' + trial + ' ' + bestGuess[1])
//   console.log(`help me ${arrBond}`)
//   return convertSemiAnnualToEAR(bestGuess[0]);
// }

// function convertSemiAnnualToEAR(semiRate) {
//   let factor = 1;
//     if (semiRate < 0) {
//       factor = -1;
//     }
//     return factor * ((semiRate + 1) ** 2 - 1);
// }

// function addResultInfo(dataArray) {

//   let addHTML = document.createElement("span");
//   // addHTML.className = "results" 
//   // addHTML.id = "cf-" + BONDCOUNTER;
//   addHTML.innerHTML = `<p>Rate of return: ${newtonRaphsonMethod(calcNPV, sumCF(dataArray))}</p>`; 
//   let resDiv = document.getElementById('results-div');
//   resDiv.appendChild(addHTML); 
// }


// This function is adapted from MDN
function getRandomInt(max, min) {
  return Math.floor(Math.random() * (max - min) + min);
}

// This function is from google charts
function fromGoogleDrawChart(arrChartData, chartTitle, chartSubTitle) {
  google.charts.load('current', {'packages':['bar']});
  google.charts.setOnLoadCallback(drawChart);
  function drawChart() {
    var data = google.visualization.arrayToDataTable(arrChartData);

    var options = {
      isStacked: true,
      height: 500,
      chartAreabackgroundColor: 'red',
      backgroundColor: '#F2E5D5',
      chartArea: {backgroundColor: '#F2E5D5'},
      // chart: {
      // title: chartTitle,
      // subtitle: chartSubTitle,
      //   }
      };
      
    var chart = new google.charts.Bar(document.getElementById('columnchart_material'));
    chart.draw(data, google.charts.Bar.convertOptions(options));
    }
}
