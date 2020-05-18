"use strict";
const path = require("path");

const debug = require("debug");
const debugOutput = debug("backend:config:development");
debug.enable("backend:*");
debugOutput("Development Configuration");
// debugOutput(process.env);

module.exports = {
  db: {
    connectString:
      "mongodb+srv://webapp:OJzMjfYO0FeipYLv@cluster0-8pgyn.azure.mongodb.net/dev?retryWrites=true&w=majority&tls=true"
  },
  log: "debug",
  ssl: {
    key: path.join(__dirname, "fakecerts/privkey.pem.fake"),
    cert: path.join(__dirname, "fakecerts/cert.pem.fake")
  },
  https: {
    port: 4433
  },
  http: {
    port: 8080
  },
  jwt: {
    secret: "correct horse battery staple",
    tokenTime: "5 minutes",
    maxIdleTime: "1 hour"
  }
};
