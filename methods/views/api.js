'use strict';
const varson = require('varson');
const wreck = require('wreck');
const Boom = require('boom');
const varsonSettings = { start: '{', end: '}' };

module.exports = (request, api, allDone) => {
  const options = { json: true };
  if (api.headers) {
    options.headers = api.headers;
  }
  const url = (typeof api === 'string') ? varson({ url: api }, request, varsonSettings).url : varson({ url: api.url }, request, varsonSettings).url;
  wreck.get(url, options, (err, res, payload) => {
    if (err) {
      return allDone(err);
    }
    if (res.statusCode !== 200) {
      return allDone(Boom.create(res.statusCode, payload.message || res.statusMessage));
    }
    return allDone(null, payload);
  });
};
