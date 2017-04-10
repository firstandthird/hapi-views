'use strict';
const api = require('./api');
const inject = require('./inject');
const yaml = require('./yaml');
const method = require('./method');
const async = require('async');
const varson = require('varson');
const Hoek = require('hoek');

module.exports = (request, config, done) => {
  async.auto({
    yaml: cb => yaml(request, config.yaml, config.options.dataPath, cb),
    api: cb => api(request, config.api, cb),
    method: cb => method(request, config.method, cb),
    inject: cb => inject(request, config.inject, cb),
    data: ['inject', 'yaml', 'api', 'method', (results, cb) => {
      if (!config.data) {
        return cb(null);
      }
      if (typeof config.data === 'string') {
        return cb(null, results[config.data]);
      }
      const data = Hoek.clone(config.data);
      const context = Hoek.clone(results);
      context.request = {
        params: request.params,
        query: request.query,
        url: request.url,
        auth: request.auth
      };
      const out = varson(data, context, { start: '{', end: '}' });
      cb(null, out);
    }],
    dataMethod: ['data', (results, cb) => {
      if (!config.dataMethod) {
        return cb(null);
      }
      const serverMethod = Hoek.reach(request.server.methods, config.dataMethod);
      if (!serverMethod) {
        return cb(new Error(`${serverMethod} is not a server method`));
      }
      serverMethod(results.data || results, cb);
    }]
  }, (err, results) => {
    if (err) {
      return done(err);
    }
    if (results.dataMethod) {
      return done(null, results.dataMethod);
    }
    delete results.dataMethod;
    if (results.data) {
      return done(null, results.data);
    }
    delete results.data;
    done(null, results);
  });
};
