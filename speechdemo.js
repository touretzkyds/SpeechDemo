'use strict';

var itemsList = [];

function onBodyLoad() {
  if (location.protocol !== 'https:') {
    let href = location.href.replace('http:', 'https:');
    console.log('redirect to:', href);
    location.replace(href);
    return;
  }

  if (annyang) {
    annyang.addCallback('error', function (err) {
      console.error('There was an error:', err);
      addError('Error: ' + err.error, 200);
    });

    annyang.addCallback('result', function (phrases) {
      addPhrases(phrases);
    });

    //annyang.addCallback('errorNetwork', notConnected, this);

    annyang.start({autoRestart: true, continuous: false});
    annyang.debug(true);
  } else {
    let isChrome =
        (navigator.userAgent.toLowerCase().indexOf('chrome') >= 0) &&
        (navigator.vendor.toLowerCase().indexOf('google') >= 0);
    let errorMessage = isChrome ?
        'Please use the latest version of Chrome to run this demo.' :
        'Sorry: this demo is only supported in Google Chrome.';
    addError(errorMessage, 2000);
  }

  setInterval(intervalFunc, 30);
}

function notConnected() {
}


function intervalFunc() {
  let emptyMain = true;
  let emptyErrors = true;
  for (let k=0; k<itemsList.length; k++) {
    let item = itemsList[k];
    if (!item.valid) { continue; }
    item.counter++;
    let element = item.element;
    let counter = item.counter;
    if (item.type == 'phrases') {
      if ((counter > 250) && (counter < 300)) {
        let opacity = 1 - Math.min(100, 1 + (counter - 250) * 2) / 100;
        element.style.opacity = opacity;
        element.style.filter = 'alpha(opacity='+String(opacity*100)+')';
      }
      if (counter > 300) {
        item.valid = false;
        element.style.display = 'none';
        item.parent.removeChild(element);
      } else {
        emptyMain = false;
      }
    } else if (item.type == 'phrase') {
      if (counter == 0) {
        element.style.display = 'block';
        item.valid = false;
      }
    } else if (item.type == 'error') {
      if (counter > 0) {
        item.valid = false;
        element.style.display = 'none';
        item.parent.removeChild(element);
      } else {
        emptyErrors = false;
      }
    } else { return; }
  }

  let emptyMessageDiv = document.getElementById('emptyMessageDiv');
  emptyMessageDiv.style.display = emptyMain ? 'block' : 'none';

  let errorsDiv = document.getElementById('errorsDiv');
  errorsDiv.style.display = emptyErrors ? 'none' : 'inline-block';

  let onDiv = document.getElementById('onDiv');
  let offDiv = document.getElementById('offDiv');
  let listening = false;
  if (annyang) {
    if (annyang.isListening()) {
      listening = true;
    }
  }
  onDiv.style.display = listening ? 'inline-block' : 'none';
  offDiv.style.display = listening ? 'none' : 'inline-block';
}

function addPhrases(phrases) {
  let mainDiv = document.getElementById('mainDiv');
  let phrasesDiv = document.createElement('div');
  phrasesDiv.className = 'phrases';
  mainDiv.appendChild(phrasesDiv);
  let item = {};
  item.counter = 0;
  item.valid = true;
  item.type = 'phrases';
  item.element = phrasesDiv;
  item.parent = mainDiv;
  itemsList.push(item);
  for (let k=0; k<phrases.length; k++) {
    let str = phrases[k];
    let phraseDiv = document.createElement('div');
    phraseDiv.className = 'phrase';
    phraseDiv.innerText = str;
    phraseDiv.style.display = 'none';
    phrasesDiv.appendChild(phraseDiv);
    let item = {};
    item.counter = -k*5 - 1;
    item.valid = true;
    item.type = 'phrase';
    item.element = phraseDiv;
    item.parent = phrasesDiv;
    itemsList.push(item);
  }
}

function addError(message, timeout) {
  let errorsDiv = document.getElementById('errorsDiv');
  let errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.innerText = message;
  errorsDiv.appendChild(errorDiv);
  let item = {};
  item.counter = -timeout;
  item.valid = true;
  item.type = 'error';
  item.element = errorDiv;
  item.parent = errorsDiv;
  itemsList.push(item);
}
