'use strict';

var itemsList = [];
var currentLanguage = -1;
var languages = [
                 {name:'English (US)', code:'en-US'},
                 {name:'English (UK)', code:'en-Gb'},
                 {name:'Spanish (US)', code:'es-US'},
                 {name:'Spanish (Spain)', code:'es-ES'},
                 {name:'French (France)', code:'fr-FR'},
                 {name:'German (Germany)', code:'de-DE'},
                 {name:'Italian (Italy)', code:'it-IT'},
                 {name:'Chinese (Mandarin)', code:'zh', readBackCode:'zh-CN', 
			 css:'chinese.css', cssLinked:false, fontFamily:'zCoolXiaoWei'}
                ];
var allowSpeechRecognition = false;
var enableSpeechRecognition = false;
var allowReadBack = false;
var textFontFamily = '';

function onBodyLoad() {
  let canUseBrowser = isChrome();
  extraChromeCheck();
  if ( (!('SpeechRecognition' in window)) && (!('webkitSpeechRecognition' in window)) ) {
    canUseBrowser = false;
  }
  if (!canUseBrowser) {
    alertForChrome();
  }

  if (location.protocol !== 'https:') {
    let href = location.href.replace('http:', 'https:');
    console.log('redirect to:', href);
    location.replace(href);
    return;
  }

  initLanguages();
  if (annyang) {
    annyang.addCallback('error', function (err) {
      if (err.error == 'no-speech') {
        if (!allowSpeechRecognition) {
          return;
        }
        console.log(err);
      } else if (err.error == 'aborted') {
        if (!allowSpeechRecognition) {
          return;
        }
        console.warn(err);
        return;
      } else {
        console.error('There was an error:', err);
      }
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
  changeLanguage();
  enableSpeechRecognition = true;
  allowReadBack = true;
  switchSpeechRecognition();
  switchReadBack();
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
    if (!allowSpeechRecognition) {
      if (item.type == 'phrases') {
        emptyMain = false;
        continue;
      }
    }
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
  console.log('addPhrases:', phrases);
  if (!allowSpeechRecognition) {
    console.error('addPhrases called when allowSpeechRecognition is false');
    return;
  }
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
    if (!isEmptyString(textFontFamily)) {
      phraseDiv.style.fontFamily = textFontFamily;
    }
    phrasesDiv.appendChild(phraseDiv);
    let item = {};
    item.counter = -k*5 - 1;
    item.valid = true;
    item.type = 'phrase';
    item.element = phraseDiv;
    item.parent = phrasesDiv;
    itemsList.push(item);
  }
  if (phrases.length > 0) {
    textToSpeech(phrases[0]);
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

function initLanguages() {
  currentLanguage = 0;
  let languageSelect = document.getElementById('languageSelect');
  for (let k = 0; k < languages.length; k++) {
    let language = languages[k];
    let option = document.createElement('option');
    option.innerHTML = language.name;
    option.value = language.code;
    languageSelect.appendChild(option);
  }
  languageSelect.selectedIndex = currentLanguage;
}

function changeLanguage() {
  let languageSelect = document.getElementById('languageSelect');
  currentLanguage = languageSelect.selectedIndex;
  let language = languages[currentLanguage];
  enableAnnyang(false);
  annyang.setLanguage(language.code);
  enableAnnyang(true);
  if (!isEmptyString(language.css)) {
    if (!language.cssLinked) {
      addCSS(language.css);
      language.cssLinked = true;
    }
  }
  textFontFamily = '';
  if (!isEmptyString(language.fontFamily)) {
    textFontFamily = language.fontFamily;
  }
  let tempDiv = document.getElementById('tempDiv');
  tempDiv.style.fontFamily = textFontFamily;
  console.log('changeLanguage:', currentLanguage, language.name, language.code, textFontFamily);
}

function switchSpeechRecognition() {
  allowSpeechRecognition = !allowSpeechRecognition;
  resetOnOffDivs();
  let recognitionButton = document.getElementById('recognitionButton');
  recognitionButton.value = allowSpeechRecognition ? 'pause' : 'resume';
  recognitionButton.style.color = allowSpeechRecognition ? 'black' : 'red';
  recognitionButton.style.backgroundColor = allowSpeechRecognition ? '' : '#ffcccc';
  recognitionButton.style.borderColor = allowSpeechRecognition ? '' : '#ffbbbb';
}

function switchReadBack() {
  allowReadBack = !allowReadBack;
  let readBackButton = document.getElementById('readBackButton');
  readBackButton.style.color = allowReadBack ? '#009900' : '#aaaaaa';
  readBackButton.style.backgroundColor = allowReadBack ? '#aaffaa' : '#dddddd';
  readBackButton.style.borderColor = allowReadBack ? '#99ff99' : '#dddddd';
}

function textToSpeech(phrase) {
  if (!allowReadBack) { return; }
  console.log('textToSpeech', phrase);
  if ('speechSynthesis' in window) {
  } else {
    addError('no support for text to speech', 1000);
    return;
  }
  var message = new SpeechSynthesisUtterance();
  let language = languages[currentLanguage];
  let code;
  if (! isEmptyString(language.readBackCode)) {
    code = language.readBackCode;
  } else {
    code = language.code;
  }
  message.text = phrase;
  message.lang = code;
  message.onstart = function(event) { onSpeakStart(event); }
  message.onend = function(event) { onSpeakEnd(); }
  message.onerror = function(event) { onSpeakError(event); }
  resumeSpeechRecognition(false);
  setTimeout(onSpeakEnd, 20000); //force enable after 20 seconds
  showReadBackBox('reading back: <span class="readBack">' + phrase + '</span>');
  window.speechSynthesis.speak(message);
}

function onSpeakStart(event) {
  console.log('onSpeakStart', event.utterance.text);
  let phrase = event.utterance.text;
  showReadBackBox('reading back: <span class="readBack">' + phrase + '</span>');
  resumeSpeechRecognition(false);
}

function onSpeakEnd() {
  console.log('onSpeakEnd');
  //showReadBackBox('');
  //resumeSpeechRecognition(true);
  setTimeout(function(){ showReadBackBox(''); resumeSpeechRecognition(true); }, 200);
}

function onSpeakError(err) {
  console.error('onSpeakError', err);
  addError('SpeakError: ' + err.error, 500);
  onSpeakEnd();
}

function showReadBackBox(message) {
  let readBackDiv = document.getElementById('readBackDiv');
  readBackDiv.innerHTML = message;
  readBackDiv.style.fontFamily = textFontFamily;
  readBackDiv.style.display = (message != '') ? 'inline-block' : 'none';
  console.log((message != ''), message);
}

function resumeSpeechRecognition(enabled) {
  console.log('resumeSpeechRecognition:', enabled);
  if (enableSpeechRecognition == enabled) { return; }
  enableSpeechRecognition = enabled;
  resetOnOffDivs();
}

function resetOnOffDivs() {
  let enable = allowSpeechRecognition && enableSpeechRecognition;
  let onDiv = document.getElementById('onDiv');
  let offDiv = document.getElementById('offDiv');
  onDiv.style.backgroundColor = enable ? 'green' : 'lightgray';
  offDiv.style.backgroundColor = enable ? 'red' : 'lightgray';
  console.log('----', enable);
  if (annyang.isListening() == enable) {
    //return;
  }
  enableAnnyang(enable);
}

function enableAnnyang(enable) {
  try {
    if (enable) {
      annyang.start({autoRestart: true, continuous: false});
    } else {
      annyang.abort();
    }
  } catch (err) {}
}

function addCSS(fileName) {
  let link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = fileName;
  document.head.appendChild(link);
  console.log('addCSS', fileName);
}

function isEmptyString(text) {
  let empty = (text == null) || (text == undefined) || (text == '');
  return empty;
}

function isChrome() {
  var isChromium = window.chrome;
  var winNav = window.navigator;
  var vendorName = winNav.vendor;
  var isOpera = typeof window.opr !== "undefined";
  var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
  var isIOSChrome = winNav.userAgent.match("CriOS");
  var isBrave = (navigator.brave === true);

  if (isIOSChrome) {
    // is Google Chrome on IOS
    return false;
  } else if(
    isChromium !== null &&
    typeof isChromium !== "undefined" &&
    vendorName === "Google Inc." &&
    isOpera === false &&
    isIEedge === false &&
    isBrave === false
  ) {
    // is Google Chrome
    return true;
  }
  return false;
}

async function extraChromeCheck() {
  let isBrave = false;
  try {
    if (navigator.brave) {
      if (await navigator.brave.isBrave()) {
        isBrave = true;
      }
    }
  } catch (err) {
  }
  if (isBrave) {
    console.error('extraChromeCheck');
    alertForChrome();
  }
}

function alertForChrome() {
  alert('Web Speech API is not supported by this browser. Please use Chrome version 25 or later.');
}