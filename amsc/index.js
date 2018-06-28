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
    .then(() => log('ID successfully reported'));
};

const completeUI = (isSuccess) => {
  document.querySelector('#loader').style.visibility = 'hidden';
  document.querySelector(isSuccess ? '#success' : '#failure').style.visibility = 'visible';
};

const main = () => {
  const id = makeID();
  return new Promise((resolve) => resolve())
    .then(() => log('Initializing ID: ' + id + ' -> ' + sha256(id)))
    .then(() => willInitFBQ(id))
    .then(() => log('Setup completed'))
    .then(() => willReport(id))
    .then(() => true)
    .catch((e) => { console.error('Catched', e); return false; })
    .then((isSuccess) => { completeUI(isSuccess); log(isSuccess ? 'Runtime completed' : 'Runtime failed'); } )
    .then(() => undefined);
};
