'use strict';
const map = require('../../lib/map.js');
const varson = require('varson');
const wreck = require('wreck');
const Boom = require('boom');
const varsonSettings = { start: '{', end: '}' };

module.exports = (request, apis, allDone) => {
  if (!apis) {
    return allDone(null, {});
  }
  map(apis, (api, varName, done) => {
    const options = { json: true };
    if (api.headers) {
      options.headers = api.headers;
    }
    const url = (typeof api === 'string') ? varson({ url: api }, request, varsonSettings).url : varson({ url: api.url }, request, varsonSettings).url;
    wreck.get(url, options, (err, res, payload) => {
      if (err) {
        return done(err);
      }
      if (res.statusCode !== 200) {
        return done(Boom.create(res.statusCode, payload.message || res.statusMessage));
      }
      return done(null, payload);
    });
  }, (err, all) => {
    allDone(err, all);
  });
};
