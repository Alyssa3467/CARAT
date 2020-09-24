/* eslint-disable no-magic-numbers */
'use strict';

const debug = require('debug')('carat:config:auth');

const BCRYPT_COST_FACTOR = (async function(testHash, minCost, loginTimeTarget) {
  const bcrypt = require('bcrypt');
  // eslint-disable-next-line camelcase
  const async_hooks = require('async_hooks');
  const { performance, PerformanceObserver } = require('perf_hooks');
  const BCRYPT_MIN_COST = parseInt(minCost) || 10;
  const BCRYPT_MAX_COST = 31;
  const LOGIN_TIME_TARGET = parseFloat(loginTimeTarget) || 1000; // milliseconds
  const TEST_WRONG_PASSWORD = 'scrambled eggs & hashed browns';
  const MAX_TEST_TIME = 1000; // milliseconds;
  const MAX_TEST_LOOPS = 10;
  // Default to precalculated hash of 'correct horse battery staple' with cost factor 10
  testHash =
    testHash || '$2b$10$hK4VxhoUT7zrcOozqgUinuf8dvAG.aUgjPzZIuFQB/hAfiPI3CWci';
  const testHashCost = bcrypt.getRounds(testHash);
  const set = new Set();
  const hook = async_hooks.createHook({
    init(id, type) {
      if (type === 'bcrypt:CompareAsyncWorker') {
        performance.mark(`bcrypt-${id}-Init`);
        set.add(id);
      }
    },
    destroy(id) {
      if (set.has(id)) {
        loops++;
        set.delete(id);
        performance.mark(`bcrypt-${id}-Destroy`);
        performance.measure(
          `bcrypt-${id}-ID`,
          `bcrypt-${id}-Init`,
          `bcrypt-${id}-Destroy`
        );
      }
    },
  });
  hook.enable();

  const obs = new PerformanceObserver((list, observer) => {
    debug(list.getEntries());
    totalElapsed += list.getEntries()[0].duration;
    debug('loops:', loops);
    debug('totalElapsed:', totalElapsed);

    if (totalElapsed >= MAX_TEST_TIME || loops >= MAX_TEST_LOOPS) {
      debug('[clearMarks]');
      testingDone = true;
      performance.clearMarks();
      observer.disconnect();
    }
  });
  obs.observe({ entryTypes: ['measure'], buffered: false });

  let loops = 0;
  let totalElapsed = 0;
  let testingDone = false;

  // eslint-disable-next-line require-jsdoc
  async function measure() {
    do {
      const coin = Math.floor(Math.random() * 2);
      if (coin == 1) {
        await performance.timerify(bcrypt.compare)(
          TEST_WRONG_PASSWORD,
          testHash
        );
      } else {
        await performance.timerify(bcrypt.compare)(
          'correct horse battery staple',
          testHash
        );
      }
    } while (!testingDone);

    return totalElapsed / loops;
  }

  debug('average:', totalElapsed / loops);

  const adjustment = Math.ceil(
    Math.log2(LOGIN_TIME_TARGET / (await measure()))
  );
  const idealCost = testHashCost + adjustment;

  const calculatedCost =
    idealCost > BCRYPT_MAX_COST
      ? BCRYPT_MAX_COST
      : idealCost > BCRYPT_MIN_COST
      ? idealCost
      : BCRYPT_MIN_COST;

  debug('testHashCost:', testHashCost);
  debug('adjustment:', adjustment);
  debug('idealCost:', idealCost);
  debug('calculatedCost:', calculatedCost);
  return calculatedCost;
})(
  process.env.TEST_HASH,
  process.env.BCRYPT_MIN_COST,
  process.env.LOGIN_TIME_TARGET
);
debug('BCRYPT_COST_FACTOR:', BCRYPT_COST_FACTOR);
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'correct horse battery staple';
debug('bcrypt options loaded');
module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    tokenTime: process.env.JWT_TOKEN_TIME,
    maxIdleTime: process.env.JWT_MAX_IDLE_TIME,
  },
  bcrypt: { costFactor: BCRYPT_COST_FACTOR },
};
