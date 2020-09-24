'use strict';

const bcrypt = require('bcrypt');
const config = require(__dirname + '/config');
const debug = require('debug')('backend:model:User');
const mongoose = require('mongoose');
const httpStatusCode = require('http-status-codes');

const Schema = mongoose.Schema;
const bcryptCostFactor = parseInt(config.bcrypt.costFactor);

const user = {};

user.userSchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  username: {
    type: String,
    lowercase: true,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  challenge: {
    type: String,
  },
});

user.model = mongoose.model('user', user.userSchema);
// const catastrophicFailureInXMsg = x => debug('Catastrophic failure in ' + x);
// const catastrophicFailurePromise = err => Promise.reject(err);

user.findByUsername = async username => {
  debug('Finding username:', username);
  const _user = await user.model.findOne({ username: username }).exec();
  debug('user:', _user);
  return _user;
};

user.create = async (username, password) => {
  debug('User.create');
  debug('userExists:', await user.model.exists({ username: username }));
  if (!await user.model.exists({ username: username })) {
    debug('Creating new user: ' + username);
    debug('bcryptCostFactor: ' + bcryptCostFactor);
    const hash = await bcrypt.hash(password, bcryptCostFactor);
    debug('hash:', hash);
    const newUser = await user.model.create({
      username: username,
      password: hash,
    });
    debug('typeof newUser', typeof newUser);
    debug('newuser:', newUser);
    return httpStatusCode.CREATED;
  } else {
    return httpStatusCode.CONFLICT;
  }
};

module.exports = user;
