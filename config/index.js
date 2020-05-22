'use strict';

require('dotenv-defaults').config();
const _ = require('lodash');
const defaults = require('./defaults.js');
const config = process.env.NODE_ENV
  ? require('./' + process.env.NODE_ENV + '.js')
  : {};
const combined = _.merge({}, defaults, config);

module.exports = combined;
