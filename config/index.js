'use strict';

require('dotenv-defaults').config();
const _ = require('lodash');
const defaults = require('./defaults.js');
const authentication = require('./authentication.js');
const config = process.env.NODE_ENV
  ? require('./' + process.env.NODE_ENV + '.js')
  : {};
const combined = _.merge({}, defaults, authentication, config);
require('debug')('carat:config:index')(combined);
module.exports = combined;
