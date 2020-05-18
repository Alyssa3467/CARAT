"use strict";

const path = require("path");

module.exports = {
  db: {
    connectString:
      "mongodb+srv://webapp:OJzMjfYO0FeipYLv@cluster0-8pgyn.azure.mongodb.net/test?retryWrites=true&w=majority&tls=true",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  log: "debug",
  ssl: {
    key: path.join(__dirname, "fakecerts/privkey.pem.fake"),
    cert: path.join(__dirname, "fakecerts/cert.pem.fake")
  },
  https: {
    port: 3443
  },
  http: {
    port: 3000
  },
  jwt: {
    secret: "correct horse battery staple",
    tokenTime: "5 minutes",
    maxIdleTime: "1 hour"
  },
  bcrypt: {
    costFactor: "7"
  }
};
