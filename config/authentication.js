"use strict";

const debug = require("debug");

// Calculates the bcrypt cost factor for a given target time
const BCRYPT_COST_FACTOR = (function(testHash, minCost, loginTimeTarget) {
  const { performance } = require("perf_hooks");
  const bcrypt = require("bcrypt");

  // Default to hash of 'correct horse battery staple' with cost factor 10
  testHash =
    testHash || "$2b$10$hK4VxhoUT7zrcOozqgUinuf8dvAG.aUgjPzZIuFQB/hAfiPI3CWci";

  const actualCost = bcrypt.getRounds(testHash);

  /* eslint-disable no-magic-numbers */
  const BCRYPT_MIN_COST = parseInt(minCost) || 10;
  const BCRYPT_MAX_COST = 31;
  const LOGIN_TIME_TARGET = parseFloat(loginTimeTarget) || 1000; // milliseconds
  /* eslint-enable no-magic-numbers */
  const TEST_WRONG_PASSWORD = "scrambled eggs & hashed browns";

  const startTime = performance.now();
  debug("TEST_WRONG_PASSWORD: " + TEST_WRONG_PASSWORD);
  debug("testHash: " + testHash);
  bcrypt.compareSync(TEST_WRONG_PASSWORD, testHash);
  const elapsedTime = performance.now() - startTime;
  debug("actualCost: " + actualCost);
  debug("elapsedTime: " + elapsedTime);

  const idealCost =
    actualCost + Math.ceil(Math.log2(LOGIN_TIME_TARGET / elapsedTime));

  const calculatedCost =
    idealCost > BCRYPT_MAX_COST
      ? BCRYPT_MAX_COST
      : idealCost > BCRYPT_MIN_COST
      ? idealCost
      : BCRYPT_MIN_COST;

  debug("idealCost: " + idealCost);
  debug("calculatedCost: " + calculatedCost);
  return calculatedCost;
})(
  process.env.TEST_HASH,
  process.env.BCRYPT_MIN_COST,
  process.env.LOGIN_TIME_TARGET
);

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "correct horse battery staple";

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    tokenTime: process.env.JWT_TOKEN_TIME,
    maxIdleTime: process.env.JWT_MAX_IDLE_TIME
  },
  bcrypt: { costFactor: BCRYPT_COST_FACTOR }
};
