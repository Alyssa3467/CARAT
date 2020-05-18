/* eslint-disable no-magic-numbers */
"use strict";

module.exports = {
  db: {
    connectString: process.env.DB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    }
  },
  ssl: {
    key: process.env.SSL_KEY,
    cert: process.env.SSL_CERT,
    pfx: process.env.SSL_PFX,
    passphrase: process.env.SSL_PASSPHRASE
  },
  https: {
    port: process.env.HTTPS_PORT
  },
  http: {
    port: process.env.HTTP_PORT
  },
  jwt: {
    secret: "correct horse battery staple",
    tokenTime: "30 minutes",
    maxIdleTime: "1 hour"
  }
};
