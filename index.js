'use strict';
/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');
const str2fn = require('str2fn');
const Boom = require('boom');
const aug = require('aug');
const defaults = {
  routeConfig: {},
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
        preProcess: done => {
          if (options.preProcess) {
            return str2fn(server.methods, options.preProcess)(request, options, reply, done);
          }

          return done();
        },
        locals: (preProcess, done) => {
          if (preProcess) {
            return done(null, false);
          }
          return FetchData.fetch(request, viewConfig, options, done);
        },
        globals: (preProcess, done) => {
          if (preProcess) {
            return done(null, false);
          }
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
          return reply(Boom.wrap(err));
        }

        // Returned early in preProcess
        if (!data.globals && !data.locals) {
          return;
        }

        const combinedData = aug('deep', {}, data.globals, data.locals);
        if (options.debug) {
          server.log(['hapi-views', 'debug'], {
            data: combinedData,
            path: request.url.path
          });
        }
        if (request.query.json === '1') {
          return reply(combinedData).type('application/json');
        }

        if (options.preResponse) {
          return str2fn(server.methods, options.preResponse)(request, options, combinedData, reply, () => {
            reply.view(viewConfig.view, combinedData);
          });
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
      config: aug('deep', {}, options.routeConfig, config.routeConfig || {})
    });

    cb();
  }, next);
};

exports.register.attributes = {
  name: 'views',
  pkg: require('./package.json')
};
