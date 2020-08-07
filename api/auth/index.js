/* eslint-disable no-magic-numbers */

'use strict';

const debug = require('debug')('backend:api:auth');
const base32 = require('base32.js');
const bcrypt = require('bcrypt');
const otplib = require('otplib');
const { JWK, JWT } = require('jose');
const joseErrors = require('jose').errors;
const httpStatus = require('http-status-codes');
const config = require(__dirname + '/config');
const user = require(__dirname + '/models/user');

// TODO: logout routine
const authentication = {};

/**
 * Validate the response to the login challenge
 * @param {string} user User to be validated
 * @param {string} response Response given by user client
 * @param {function} callback Callback to handle result
 */
async function validateResponse(user, response) {
  const correctResponse = otplib.authenticator.generate(user.challenge);
  debug('correct response: ' + correctResponse);
  const result = await bcrypt.compare(
    correctResponse + user.password,
    response
  );
  debug('validated: ' + result);
  return result;
}

/**
 * Generate OTP seed
 * @return {string} OTP Seed
 */
const generateChallenge = () => {
  const challenge = base32.encode(crypto.randomBytes(10));
  debug('challenge: ' + challenge);
  return challenge;
};

// TODO: Add throttling
// TODO: Check to see if the user is already logged in
authentication.signup = (req, res) => {
  debug('Started auth.signup()');
  debug('req.body.username: ' + req.body.username);
  debug('req.body.password: ' + req.body.password);
  if (!req.body.username || !req.body.password) {
    debug('auth.signup() failed');
    // no username or no password, return status 400 Bad Request
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide a name and password.',
    });
  }

  debug('Calling user.create()', req.body.username, req.body.password);

  // TODO: Don't disclose success/fail in case of possible attack
  // create new user
  user
    .create(req.body.username, req.body.password)
    .then(code => {
      debug('User.create() returned code: ' + code);
      res.status(code);
      switch (code) {
        case httpStatus.CREATED:
          debug('Signup success');
          return res.json({
            success: true,
            msg: 'New user created',
          });
        case httpStatus.CONFLICT:
          debug('Conflict');
          return res.json({
            success: false,
            message: 'Conflict',
          });
        default:
          debug('Catastrophic failure');
          return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
      }
    })
    .catch(err => {
      debug('Signup error');
      debug(err);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: 'Something went wrong',
      });
    });
};

// TODO: Add throttling
// TODO: Rotating JWT secrets?
// TODO: Check for someone already logged in
// TODO: Beef up defense for timing attack
authentication.login = async function(req, res) {
  debug('Request query:');
  debug(req.query);
  debug('Request body:');
  debug(req.body);
  if (!req.body.username || !req.body.password) {
    debug('auth.login(): Username or password missing');
    // no username or no password, return status 400 Bad Request
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide a name and password.',
    });
  }

  let _user;

  try {
    debug('finding user');
    _user = await user.findByUsername(req.body.username);
  } catch (e) {
    debug(e);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).end();
  }
  debug('User.findByUsername returned: ');
  debug(_user);
  if (_user === null) {
    debug('Did not find user ' + req.body.username);
    return res
      .status(httpStatus.UNAUTHORIZED)
      .header('WWW-Authenticate', 'Bearer')
      .json({
        success: false,
        msg: 'Unauthorized',
      });
  } else {
    debug('typeof req.body.response: ');
    debug(typeof req.body.response);

    // Extracts the salt from the given hash
    const getSalt = hash => {
      // nthIndex = index of nth occurence of $
      const indexOfNth = (hash, n, prev = 0) => {
        return n == 0
          ? prev
          : indexOfNth(hash, n - 1, hash.indexOf('$', prev) + 1);
      };
      const salt = hash.substr(0, 22 + indexOfNth(hash, 3));
      debug('salt: ' + salt);
      return salt;
    };

    // Issues a login challenge
    const issueChallenge = () => {
      const salt = getSalt(_user.password);
      _user.challenge = generateChallenge();
      debug('user.challenge: ' + _user.challenge);
      _user.save();
      const response = res
        .status(httpStatus.UNAUTHORIZED)
        .header('WWW-Authenticate', 'Bearer')
        .json({
          code: 412,
          success: false,
          msg: 'No response to challenge',
          challenge: _user.challenge,
          salt: salt,
        });
      return response;
    };

    // Thanks to short-circuit evaluation, response.length won't happen if response is null
    if (
      typeof req.body.response === 'undefined' ||
      req.body.response === null ||
      req.body.response.length == 0
    ) {
      debug('Issuing challenge for missing response');
      // Issue a challenge if no response is found
      return issueChallenge();
    } else {
      if (await validateResponse(_user, req.body.response)) {
        // Issue JWT Token
        const payload = {};
        const options = {};
        payload.username = _user.username;
        // How long the token lasts before it EXPires
        options.expiresIn = config.jwt.tokenTime;
        options.nonce = _user.challenge;
        const token = JWT.sign(payload, config.jwt.secret, options); // Sign and encode JWT
        return res.json({
          success: true,
          token: 'JWT ' + token,
        });
      } else {
        return issueChallenge();
      }
    }
  }
};

authentication.validate = async function(req, res, next) {
  const opts = {};

  let token;
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length == 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    }
  } else {
    // No token found, return 401 Unauthorized
    return res.status(httpStatus.UNAUTHORIZED).end();
  }

  const decodedToken = JWT.decode(token);
  const keyOrStore = JWK.asKey(config.jwt.secret);

  let _user;
  try {
    _user = await user.findByUsername(decodedToken.username);
    opts.nonce = _user.challenge;
    JWT.verify(token, keyOrStore, opts);
    next();
  } catch (e) {
    if (e instanceof joseErrors.JOSEError) {
      if (e.code === 'ERR_JOSE_MULTIPLE_ERRORS') {
        for (const eep of e) {
          debug(eep);
        }
      } else {
        debug(e.code);
      }
    } else {
      debug(e);
    }
    return res.status(httpStatus.UNAUTHORIZED).end();
  }
};

module.exports = authentication;
