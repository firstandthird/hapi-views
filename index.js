'use strict';
/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');
const merge = require('lodash.merge');
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
