'use strict';
const Boom = require('boom');
const version = require('../../package.json').version;

module.exports = (request, url, allDone) => {
  const headers = { referer: request.info.referrer, 'user-agent': `hapi-views/${version}` };
  request.server.inject({ url, headers }, (response) => {
    if (response.statusCode !== 200) {
      // boom error responses can be repackaged and passed back to the caller:
      if (response.result && response.result.message) {
        return allDone(Boom.create(response.statusCode, response.result.message));
      }
      return allDone(Boom.create(response.statusCode, response.statusMessage));
    }
    return allDone(null, response.result);
  });
};
