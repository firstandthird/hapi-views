'use strict';
const Boom = require('boom');
const version = require('../../package.json').version;

module.exports = (request, url, allDone) => {
  const headers = { referer: request.info.referrer, 'user-agent': `hapi-views/${version}` };
  request.server.inject({ url, headers }, (response) => {
    if (response.statusCode !== 200) {
      return allDone(Boom.create(response.statusCode, response.statusMessage));
    }
    return allDone(null, response.result);
  });
};
