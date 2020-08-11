'use strict';

global.__basedir = __dirname;

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const debug = require('debug')('carat:main');
const express = require('express');
const helmet = require('helmet');
const hpp = require('hpp'); // HTTP Parameter Pollution prevention
const httpStatus = require('http-status-codes');
const logger = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
// const favicon = require('serve-favicon');

// Load config files
const config = require('./config');

// Database Setup
// Use native promises
mongoose.Promise = global.Promise;
// Connect to database
// TODO: do something with caught connection errors?
mongoose.connect(config.db.uri, config.db.options).catch(error => {
  debug(error);
  createError(httpStatus.INTERNAL_SERVER_ERROR, error);
});
mongoose.connection.on('error', err => {
  createError(httpStatus.INTERNAL_SERVER_ERROR, err);
});

const app = express();

// Header hardening
app.use(helmet());
// Protect against HTTP Parameter Pollution attacks
app.use(hpp());
const loggerFormat =
  ':date[iso] :remote-addr :method :url :status :referrer :user-agent :response-time ms - :res[content-length]';
app.use(logger(loggerFormat));
// Parse req.body for JSON
app.use(bodyParser.json());
// Parse req.body for POST parameters
app.use(bodyParser.urlencoded({ extended: false }));
// Parse req.body for cookies
app.use(cookieParser());

// uncomment after placing favicon in /public_html
// app.use(favicon(__dirname + '/public_html/favicon.ico'));

/**
 * Routes go here
 */

// Handle static files
app.use(express.static(path.join(__dirname, 'public_html')));

// Any routes not handled get sent to the error handler as 404
app.use(function error404(req, res, next) {
  next(createError(httpStatus.NOT_FOUND));
});

// error handler
app.use(function handleError(err, req, res, _next) {
  debug('HTTP/HTTPS error handler');
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // TODO: Make some kind of error template
  // render the error page
  res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR);
  res.send(res.locals.message + res.locals.error);
});

module.exports = app;
