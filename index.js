/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');

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
      FetchData.fetch(request, viewConfig, options, (err, data) => {
        if (err) {
          return reply(err);
        }

        if (options.debug) {
          server.log(['hapi-views', 'debug'], {
            data,
            path: request.url.path
          });
        }
        if (request.query.json === '1') {
          return reply(data).type('application/json');
        }
        return reply.view(viewConfig.view, data);
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
