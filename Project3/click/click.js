BGCOLOR = '#F2e5d5';
COLOR0 = '#8c8070';
COLOR1 = '#d99379';
COLOR2 = '#201d1d';
COLOR3 = '#8c311c';
COLOR4 = '#594e3f';
COLORINDEX = 0;

PAINTMODE = false;
TOGGLE = false;
SIZE = false;
ERASE = false;


arrColors = [COLOR1, COLOR2, COLOR3, COLOR4];
arrRadii = [10, 20, 30, 45, 60, 75, 100];
//arrTimes = [0, 320, 500, 800, 1280, 1920, 2556];
arrTimes = [0, 300, 600, 850, 1000, 1200, 1500];

window.addEventListener("DOMContentLoaded", initialHandler);

function initialHandler() {

    const refreshButton = document.getElementById("refresh-button");
    refreshButton.addEventListener("click", refreshButtonHandler);

    const paintButton = document.getElementById("paint-button");
    paintButton.addEventListener("click", paintButtonHandler);

    const toggleButton = document.getElementById("toggle-button");
    toggleButton.addEventListener("click", toggleButtonHandler);
    
    const sizeButton = document.getElementById("size-button");
    sizeButton.addEventListener("click", sizeButtonHandler);
    
    const eraseButton = document.getElementById("erase-button");
    eraseButton.addEventListener("click", eraseButtonHandler);
    eraseButtonHandler();

    const body = document.getElementsByTagName("body")[0]
    body.addEventListener("keypress", keyPressHandler);

    const canvas = document.getElementsByTagName("canvas")[0];
    canvas.addEventListener("click", clickHandler);
    canvas.height = window.innerHeight - 80;
    canvas.width = window.innerWidth - 50;
}

function paintButtonHandler() {
    refreshButtonHandler();
    const canvas = document.getElementsByTagName("canvas")[0];
    const paintButton = document.getElementById("paint-button");
    if (!PAINTMODE) {
        canvas.style.backgroundColor = COLOR2;
        paintButton.style.backgroundColor = COLOR1;
        PAINTMODE = true;
    } else {
        canvas.style.backgroundColor = BGCOLOR;
        paintButton.style.backgroundColor = COLOR3;
        PAINTMODE = false;
    };
}

function refreshButtonHandler() {
    let canvas = document.getElementsByTagName("canvas")[0];
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleButtonHandler() {
    const toggleButton = document.getElementById("toggle-button");
    if (!TOGGLE) {
        TOGGLE = true;
        toggleButton.style.backgroundColor = COLOR1;
    } else {
        TOGGLE = false;
        toggleButton.style.backgroundColor = COLOR3;
    }
}

function sizeButtonHandler() {
    const sizeButton = document.getElementById("size-button");
    if (!SIZE) {
        SIZE = true;
        arrRadii = [10, 16, 25, 64, 103, 166, 268];
        sizeButton.style.backgroundColor = COLOR1;
    } else {
        SIZE = false;
        arrRadii = [10, 20, 30, 45, 60, 75, 100];
        sizeButton.style.backgroundColor = COLOR3;
    }
}

function eraseButtonHandler() {
    const eraseButton = document.getElementById("erase-button");
    if (!ERASE) {
        ERASE = true;
        eraseButton.style.backgroundColor = COLOR1;
    } else {
        ERASE = false;
        eraseButton.style.backgroundColor = COLOR3;
    }
}

function keyPressHandler(event){
    let key = event.code;
    if (key === 'KeyP') {
        paintButtonHandler();
    } else if (key === 'KeyE') {
        eraseButtonHandler();
    } else if (key === 'KeyM') {
        toggleButtonHandler();
    } else if (key === 'KeyR') {
        refreshButtonHandler();
    } else if (key == 'KeyS') {
        sizeButtonHandler();
    }
}

function clickHandler(event) {
    const canvas = document.getElementsByTagName("canvas")[0];
    let context = canvas.getContext("2d");
    const xOffset = -17;
    const yOffset = - 120;
    let x = event.clientX + xOffset;
    let y = event.clientY + yOffset; 
    // console.log(x + ' ' + y);
    genCirclesFromClick(x, y);
}


function drawCircles(x, y, r, t) {
    let modByThis = arrColors.length; 
    const canvas = document.getElementsByTagName("canvas")[0];
    let context = canvas.getContext("2d");
    const offSet = 10;

    setTimeout(function() {
        context.strokeStyle = arrColors[COLORINDEX++ % modByThis];
        context.lineWidth = 1;
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.stroke();
        if (TOGGLE) {
            context.beginPath();
            context.arc(x, y, r + offSet, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.arc(x, y, r + offSet * 2, 0, Math.PI * 2);
            context.stroke();
        };
        setTimeout(function () {
            if (ERASE) {
                context.strokeStyle = BGCOLOR;
                context.lineWidth = 3;
                context.beginPath();
                context.arc(x, y, r, 0, Math.PI * 2);
                context.stroke();
                if (TOGGLE) {
                    context.beginPath();
                    context.arc(x, y, r + offSet, 0, Math.PI * 2);
                    context.stroke();
                    context.beginPath();
                    context.arc(x, y, r + + offSet * 2, 0, Math.PI * 2);
                    context.stroke();
                };
            }
        }, (t / 2 + 400));
    }, t);
}

function genCirclesFromClick(x, y) {
    for (r in arrRadii) {
        drawCircles(x, y, arrRadii[r], arrTimes[r] / 2);
    };
}
