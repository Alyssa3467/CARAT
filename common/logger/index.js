/* eslint-disable require-jsdoc, sort-keys, no-magic-numbers */
'use strict';

const debug = require('debug')('carat:common:logger');
const defaults = require('lodash/defaults');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

function main(options) {
  debug('set up logger');
  const logFormat =
    ':date[iso] :remote-addr :user-agent :referrer :method :url :status :res[content-length] - :response-time ms';
  options = defaults(options || {}, {
    logPath: 'logs/httpd/',
    logFormat: logFormat,
    stdout: false,
    file: true,
    frequency: 'daily',
    day: 0,
    hour: 0,
    minute: 0,
  });
  debug('logger options', options);

  class RotatingStream extends fs.WriteStream {
    #options = {
      logPath: 'logs/httpd/',
      logFormat: logFormat,
      stdout: false,
      file: true,
      frequency: 'daily',
      day: 0,
      date: 0,
      hour: 0,
      minute: 0,
    };

    // add leading 0 to single-digit numbers
    #pad = function(num) {
      return (num > 9 ? '' : '0') + num;
    };

    // break up a Date() into constituent parts
    #decompose = function(date = new Date()) {
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth(),
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
      };
    };

    constructor(options) {
      super(options);
      this.#options = defaults(this.#options, options);
      debug('constructor');
    }

    *generator() {
      debug('inside generator');
      const now = new Date();
      const { year, month, day, hour, minute } = this.#decompose(now);
      switch (this.#options.frequency) {
        case 'hourly':
          break;
        case 'daily':
          break;
        case 'weekly':
          break;
        case 'monthly':
          break;
        default:
          yield 'httpd.log';
      }
    }

    _write(chunk, encoding, callback) {
      super._write(chunk, encoding, callback);
    }

    _writev(chunks, callback) {
      super._writev(chunks, callback);
    }

    _final(callback) {
      super._final(callback);
    }
  }

  return morgan(logFormat);

  // return (req, res, next) => {
  //   debug('event to be logged');
  //   next();
  // };
}

module.exports = main;
