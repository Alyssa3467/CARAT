/* eslint-disable sort-keys */
'use strict';

const path = require('path');

module.exports = {
  ssl: {
    key: path.join(__dirname, 'testcerts/privkey.pem.fake'),
    cert: path.join(__dirname, 'testcerts/cert.pem.fake'),
  },
};
