'use strict';

const request = require('supertest');
const app = require('../app');
// const assert = require('assert');

describe('Something', function() {
  it('does something', function() {
    return request(app).get('/');
  });
});
