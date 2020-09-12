// /* eslint-disable sort-keys */
'use strict';

module.exports = {
  ssl: {
    key: process.env.SSL_KEY,
    cert: process.env.SSL_CERT,
    pfx: process.env.SSL_PFX,
    passphrase: process.env.SSL_PASSPHRASE,
  },
  https: {
    port: '443',
  },
  http: {
    port: '80',
  },
};
