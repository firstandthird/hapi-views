'use strict';
const Boom = require('boom');

module.exports = (request, url, allDone) => {
  request.server.inject({ url }, (response) => {
    if (response.statusCode !== 200) {
      return allDone(Boom.create(response.statusCode, response.statusMessage));
    }
    return allDone(null, response.result);
  });
};
