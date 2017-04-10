'use strict';
const Boom = require('boom');
const map = require('../../lib/map.js');
const varson = require('varson');

module.exports = (request, urls, done) => {
  const server = request.server;
  map(urls, (url, name, cb) => {
    const obj = varson({
      url
    }, request, { start: '{', end: '}' });
    server.inject(obj, (response) => {
      if (response.statusCode !== 200) {
        return cb(Boom.create(response.statusCode, response.statusMessage));
      }
      return cb(null, response.result);
    });
  }, done);
};
