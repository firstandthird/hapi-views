'use strict';
const async = require('async');

module.exports = (input, method, done) => {
  if (!input) {
    return done(null, {});
  }
  if (typeof input !== 'object') {
    throw new Error('new version of hapi-views requires an object for each type');
  }
  async.mapValues(input, method, (err, results) => {
    if (err) {
      return done(err);
    }
    done(null, results);
  });
};
