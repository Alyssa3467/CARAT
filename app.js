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
const path = require('path');
// const favicon = require('serve-favicon');

const app = express();

// Header hardening
app.use(helmet());
// Protect against HTTP Parameter Pollution attacks
app.use(hpp());
const loggerFormat =
  ':date[iso] :remote-addr :method :url :status :referrer :user-agent :response-time ms - :res[content-length]';
app.use(logger(loggerFormat));
// parse req.body for JSON
app.use(bodyParser.json());
// parse req.body for POST parameters
app.use(bodyParser.urlencoded({ extended: false }));
// parse req.body for cookies
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
