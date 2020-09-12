// /* eslint-disable sort-keys */
'use strict';

const path = require('path');

module.exports = {
  db: {
    uri: 'mongodb+srv://cluster0.tvevf.azure.mongodb.net/',
    options: {
      dbName: 'devDB',
      auth: {
        user: 'webapp',
        pass: 'IDfXQHD6nV8oT4vh',
      },
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      retryWrites: true,
      w: 'majority',
    },
  },
  https: {
    port: 4433,
  },
  http: {
    port: 8080,
  },
  ssl: {
    key: path.join(__dirname, 'testcerts/privkey.pem.fake'),
    cert: path.join(__dirname, 'testcerts/cert.pem.fake'),
  },
};
