const APP_ID = 234181490713918;
const PIXEL_ID = 284034638805007;
const FBQ_MSLEEP = 2000;
const POSTBACK_URL = 'https://arcane-wildwood-18928.herokuapp.com/';

const log = function() {
  if (arguments.length > 0) {
    if (typeof arguments[0] === 'string') {
      arguments[0] = ' > ' + arguments[0];
    }
    console.log.apply(undefined, arguments);
  }
};

const makeID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    c => {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    }
  );
};

const willInitFB = () => {
  return new Promise(function(resolve, reject) {
    log('Initializing App: ' + APP_ID);
    window.fbAsyncInit = resolve;
  }).then(() => {
    window.FB.init({
      appId : APP_ID,
      cookie : true,
      version : 'v3.0',
    });
  });
};

const willInitFBQ = (externalID) => {
  fbq('set', 'autoConfig', false, PIXEL_ID.toString());
  log('Initializing pixel: ' + PIXEL_ID);
  fbq('init', PIXEL_ID, { external_id: externalID });
  fbq('track', 'PageView', {env: 'prn_amsc', external_id: externalID});
  return new Promise(resolve => setTimeout(resolve, FBQ_MSLEEP));
};

const willReport = (externalID) => {
  log('Reporting ID');
  const xhr = new XMLHttpRequest();
  xhr.open('GET', POSTBACK_URL + sha256(externalID), true);
  return new Promise((resolve, fail) => {
    xhr.onload = () => {
      if (xhr.readyState === 4) {
        const callback = xhr.status === 200 ? resolve : fail;
        callback(JSON.parse(xhr.responseText));
      }
    }
    xhr.onerror = () => fail({error: xhr.statusText});
    xhr.send(null);
  })
    .then(() => log('ID successfullt reported'));
};

const completeUI = (isSuccess) => {
  document.querySelector('#loader').style.visibility = 'hidden';
  document.querySelector(isSuccess ? '#success' : '#failure').style.visibility = 'visible';
  log(isSuccess ? 'Completed' : 'Failed');
};

const main = () => {
  const id = makeID();
  const initHandles = [
    log('Initializing ID: ' + id + ' -> ' + sha256(id)),
    willInitFB(),
    willInitFBQ(id),
  ];

  return Promise.all(initHandles)
    .then(() => log('App Initialized'))
    .then(() => willReport(id))
    .then(() => true)
    .catch((e) => { console.error('Catched', e); return false; })
    .then(completeUI)
    .then(() => undefined);
};
