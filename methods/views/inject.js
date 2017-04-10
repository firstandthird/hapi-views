'use strict';
const Boom = require('boom');
const varson = require('varson');

module.exports = (request, url, allDone) => {
  const server = request.server;
  const obj = varson({
    url
  }, request, { start: '{', end: '}' });

  server.inject(obj, (response) => {
    if (response.statusCode !== 200) {
      return allDone(Boom.create(response.statusCode, response.statusMessage));
    }
    return allDone(null, response.result);
  });
};
