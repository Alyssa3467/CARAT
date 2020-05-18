"use strict";

require("dotenv-defaults").config();

const _ = require("lodash");
const defaults = require("./defaults.js");
const authentication = require("./authentication.js");
const config = require("./" + (process.env.NODE_ENV || "development") + ".js");
const combined = _.merge({}, defaults, authentication, config);

module.exports = combined;
