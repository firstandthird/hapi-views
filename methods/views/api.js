'use strict';
const wreck = require('wreck');
const Boom = require('boom');
const version = require('../../package.json').version;

module.exports = (request, api, allDone) => {
  const options = {
    timeout: 5000,
    json: true,
    headers: {}
  };
  if (api.headers) {
    options.headers = api.headers;
  }
  options.headers.referer = request.info.referrer;
  options.headers['user-agent'] = `hapi-views/${version}`;
  const url = typeof api === 'string' ? api : api.url;
  wreck.get(url, options, (err, res, payload) => {
    if (err) {
      // boom response can be repackaged for hapi to pass back to the caller:
      if (err.isBoom) {
        const mssg = (err.data) ? err.data.payload.message : err.output.payload.messge;
        return allDone(Boom.create(err.output.statusCode, mssg));
      }
      return allDone(err);
    }
    if (res.statusCode !== 200) {
      return allDone(Boom.create(res.statusCode, payload.message || res.statusMessage));
    }
    return allDone(null, payload);
  });
};
