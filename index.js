/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');

const defaults = {
  views: {}
};

exports.register = function(server, options, next) {
  options = hoek.applyToDefaults(defaults, options);

  const FetchData = new require('./lib/fetch-data')(server);

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
      config: options.routeConfig || {}
    });

    cb();
  }, next);
};

exports.register.attributes = {
  name: 'views',
  pkg: require('./package.json')
};
