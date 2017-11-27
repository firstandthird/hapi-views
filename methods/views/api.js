'use strict';
const wreck = require('wreck');
const Boom = require('boom');
const version = require('../../package.json').version;

module.exports = async (request, api) => {
  return new Promise(async (resolve, reject) => {
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
    try {
      const { res, payload } = await wreck.get(url, options);
      if (res.statusCode !== 200) {
        return reject(Boom.create(res.statusCode, payload.message || res.statusMessage));
      }
      return resolve(payload);
    } catch (err) {
      if (err.isBoom) {
        const mssg = (err.data) ? err.data.payload.message : err.output.payload.messge;
        return reject(Boom.create(err.output.statusCode, mssg));
      }
      return reject(err);
    }
  });
};
