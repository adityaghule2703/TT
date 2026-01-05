// pusher-polyfills.js
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
    }
  };
}

if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

if (typeof global.process === 'undefined') {
  global.process = require('process');
}

// Polyfill for netinfo (which pusher-js tries to use)
global.NetInfo = {
  addEventListener: () => ({ remove: () => {} }),
  fetch: () => Promise.resolve({ isConnected: true })
};