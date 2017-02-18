'use strict';
/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');
const merge = require('lodash.merge');
const str2fn = require('str2fn');
const defaults = {
  debug: false,
  views: {}
};

exports.register = function(server, options, next) {
  options = hoek.applyToDefaults(defaults, options);

  const Fetch = require('./lib/fetch-data');
  const FetchData = new Fetch(server);

  if (options.cache) {
    server.log(
      ['error', 'hapi-views'],
      'Cache option is deprecated, use options.routeConfig.cache instead'
    );
  }

  const renderHandler = function(viewConfig) {
    return function(request, reply) {
      async.autoInject({
        locals: done => FetchData.fetch(request, viewConfig, options, done),
        globals: done => {
          if (!options.globals) {
            return done(null, {});
          }
          FetchData.fetch(request, options.globals, options, done);
        }
      }, (err, data) => {
        if (err) {
          if (typeof options.onError === 'function') {
            return options.onError(err, reply);
          }
          if (typeof viewConfig.onError === 'function') {
            return viewConfig.onError(err, reply);
          }
          if (typeof options.onError === 'string') {
            return str2fn(server.methods, options.onError)(err, reply);
          }
          if (typeof viewConfig.onError === 'string') {
            return str2fn(server.methods, viewConfig.onError)(err, reply);
          }
          // todo: handle per-view onError
          return reply(err);
        }
        const combinedData = merge(data.globals, data.locals);
        if (options.debug) {
          server.log(['hapi-views', 'debug'], {
            data: combinedData,
            path: request.url.path
          });
        }
        if (request.query.json === '1') {
          return reply(combinedData).type('application/json');
        }
        return reply.view(viewConfig.view, combinedData);
      });
    };
  };

  //routes
  async.forEachOfSeries(options.views, (config, path, cb) => {
    // verify all top-level "api" specs are objects
    if (config.api && typeof config.api !== 'object') {
      throw new Error(`route ${path} api is "${config.api}" of type ${typeof config.api}. api must be specified as an object in new versions of hapi-views`);
    }

    server.route({
      path,
      method: 'get',
      handler: renderHandler(config),
      config: config.routeConfig || {}
    });

    cb();
  }, next);
};

exports.register.attributes = {
  name: 'views',
  pkg: require('./package.json')
};
