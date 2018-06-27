const APP_ID = 234181490713918;
const PIXEL_ID = 284034638805007;
const FBQ_MSLEEP = 2000;

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

const willFireEvent = (externalID, eventName, params) => {
  const hash = sha256(externalID);
  const event = Object.assign(
    params || {},
    {_eventName: eventName, external_id: externalID, external_hash: hash}
  );
  const payload = {
    advertiser_id: '0000-0000-0000-0000',
    advertiser_tracking_enabled: true,
    application_tracking_enabled: true,
    extinfo: {0: 'pcg1', 2: 'proto-0.0.1', 3: 10, 5: 'LENOVO ThinkPad T410', 6: navigator.language.replace('-', '_')},
    ud: {extern_id: hash, extern_namespace: PIXEL_ID},
    event: 'CUSTOM_APP_EVENTS',
    custom_events: [event],
  };
  log('Firing app event: ' + eventName);
  return new Promise(resolve => FB.api('/' + APP_ID + '/activities', 'POST', payload, resolve))
    .then(v => {if (v.error) throw new Error(v.error.message);});
};

const willFireActivateApp = (externalID) => willFireEvent(externalID, 'fb_mobile_activate_app');

const willFirePurchase = (externalID) => willFireEvent(externalID, 'fb_mobile_purchase', {value: 10.00, currency: 'USD'});

const completeUI = (isSuccess) => {
  document.querySelector('#loader').style.visibility = 'hidden';
  document.querySelector(isSuccess ? '#success' : '#failure').style.visibility = 'visible';
};

const main = () => {
  const id = makeID();
  const initHandles = [
    log('Initializing ID: ' + id),
    willInitFB(),
    willInitFBQ(id),
  ];

  return Promise.all(initHandles)
    .then(() => log('App Initialized'))
    .then(() => willFireActivateApp(id))
    .then(() => willFirePurchase(id))
    .then(() => true)
    .catch((e) => { console.error('Catched', e); return false; })
    .then(completeUI)
    .then(() => undefined);
};
