/* eslint-disable sort-keys */
'use strict';

module.exports = {
  ssl: {
    key: process.env.SSL_KEY,
    cert: process.env.SSL_CERT,
    pfx: process.env.SSL_PFX,
    passphrase: process.env.SSL_PASSPHRASE,
  },
  https: {
    port: process.env.HTTPS_PORT,
  },
  http: {
    port: process.env.HTTP_PORT,
  },
  logs: {
    httpd: './logs/httpd/',
  },
};
