"use strict";
/* eslint-disable no-console */
/* jshint -W117 -W033 */

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const debug = require("debug")("server:main");
const express = require("express");
const fs = require("fs");
const helmet = require("helmet");
const hpp = require("hpp"); // Express middleware to protect against HTTP Parameter Pollution attacks
const http = require("http");
const https = require("https");
const createError = require("http-errors");
const httpStatus = require("http-status-codes");
const logger = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
// const favicon = require('serve-favicon');

// Load config files
const config = require("./config");
/* eslint-disable no-magic-numbers */
const httpsPort = normalizePort(config.https.port || 8443);
const httpPort = normalizePort(config.http.port || 8080);
/* eslint-enable no-magic-numbers */

// Set up Mongoose
mongoose.Promise = global.Promise; // Use native promises
const mongooseOptions = config.db.options;
mongoose
  .connect(config.db.connectString, mongooseOptions)
  .catch(function(error) {
    debug(error);
    createError(httpStatus.INTERNAL_SERVER_ERROR);
  });

const app = express();
// header hardening
app.use(helmet());
// protect against HTTP parameter pollution attacks
app.use(hpp());
// set up logger format
const loggerFormat =
  ":date[web] :remote-addr :method :url :status :referrer :user-agent :response-time ms - :res[content-length]";
app.use(logger(loggerFormat));
// parse req.body for JSON
app.use(bodyParser.json());
// parse req.body for POST parameters
app.use(bodyParser.urlencoded({ extended: false }));
// parse req.body for cookies
app.use(cookieParser());

/**
 * HTTP to HTTPS redirect
 */
app.use(function(req, res, next) {
  /* jshint -W117, -W014, -W030 */
  debug("req.url: " + req.url);
  const url = new URL(req.url, `http://${req.headers.host}`);
  debug("url: " + url);
  // eslint-disable-next-line no-magic-numbers
  httpsPort != 0
    ? req.secure
      ? next()
      : res.redirect(
          httpStatus.PERMANENT_REDIRECT,
          "https://" + url.hostname + ":" + httpsPort + req.url
        )
    : next();
});

// uncomment after placing favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));

// route for static files
app.use(express.static(path.join(__dirname, "public_html")));

/**
 *
 * routes here
 *
 */

// Any routes not handled get sent to the error handler as 404
app.use(function(req, res, next) {
  next(createError(httpStatus.NOT_FOUND));
});

// error handler
app.use(function(err, req, res, _next) {
  debug("error handler");
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // TODO: Make some kind of error template
  // render the error page
  res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR);
  res.send(res.locals.message + res.locals.error);
});

/**
 * HTTPS
 */
const httpsOptions = {
  passphrase: config.ssl.passphrase,
  minVersion: "TLSv1.2", // Apparently Postman doesn't support TLSv1.3
  ciphers:
    "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:HIGH:!EXPORT:!MEDIUM:!LOW:!aNULL:!eNULL:!SSLv2:!SHA1:!CAMELLIA:!RSA"
};

let certLoaded = false;
// Try to load SSL certificate, preferring key/cert over PKCS #12
try {
  try {
    if (
      typeof config.ssl.key !== "undefined" &&
      typeof config.ssl.cert !== "undefined"
    ) {
      httpsOptions.key = fs.readFileSync(config.ssl.key);
      httpsOptions.cert = fs.readFileSync(config.ssl.cert);
      certLoaded = true;
    }
  } catch (e) {
    try {
      if (typeof config.ssl.pfx !== "undefined") {
        httpsOptions.pfx = fs.readFileSync(config.ssl.pfx);
        certLoaded = true;
      }
    } catch (e) {
      throw new Error("Unable to load SSL certificate");
    }
  }
} catch (e) {
  httpsOptions.pfx = undefined;
  httpsOptions.key = undefined;
  httpsOptions.cert = undefined;
  debug(e);
  console.error("Unable to load SSL certificate");
}
debug(httpsOptions);

// start HTTPS if there's a valid certificate
let httpsServer = null;
if (certLoaded) {
  app.set("httpsPort", httpsPort);
  debug("https port " + httpsPort);

  /**
   * Create HTTPS server and set listeners
   */
  httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(httpsPort);
  httpsServer.on("error", onhttpsError);
  httpsServer.on("listening", onhttpsListening);
} else {
  console.error("Problem starting HTTPS");
}
/**
 * End HTTPS section
 */

/**
 * Create HTTP server and set listeners
 */
const httpServer = http.createServer(app);
httpServer.listen(httpPort);
httpServer.on("error", onhttpError);
httpServer.on("listening", onhttpListening);

/**
 * Functions
 */

/**
 * Normalize a port into a number, string, or false.
 * @param {number} val Port number
 * @return {any} number, string, or false
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  // eslint-disable-next-line no-magic-numbers
  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP/HTTPS server 'listening' event.
 * @param {boolean} secure https flag
 */
function onListening(secure) {
  const addr = secure ? httpsServer.address() : httpServer.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Listening on " + bind);
}
/**
 * https error listener
 * @param {any} error
 */
function onhttpsError(error) {
  onError(error, true);
}
/**
 * http error listener
 * @param {any} error
 */
function onhttpError(error) {
  onError(error, false);
}
/** https 'listening' listener */
function onhttpsListening() {
  onListening(true);
}
/** http 'listening' listener */
function onhttpListening() {
  onListening(false);
}

/**
 * Event listener for HTTP server 'error' event.
 * @param {any} error 'error' event
 * @param {boolean} secure https flag
 */
function onError(error, secure) {
  const port = secure ? httpsPort : httpPort;
  if (error.syscall !== "listen") {
    throw error;
  }

  /* eslint-disable no-magic-numbers */
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
  /* eslint-enable no-magic-numbers */
}

module.exports = app;
