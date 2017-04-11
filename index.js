'use strict';
/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');
const aug = require('aug');
const renderHandler = require('./lib/handler.js');
const serverMethods = ['api', 'inject', 'yaml', 'method'];
const defaults = {
  routeConfig: {},
  debug: false,
  views: {}
};

exports.register = function(server, options, next) {
  options = hoek.applyToDefaults(defaults, options);
  if (options.cache) {
    server.log(
      ['error', 'hapi-views'],
      'Cache option is deprecated, use options.routeConfig.cache instead'
    );
  }
  serverMethods.forEach((methodName) => {
    // todo: add caching options:
    const methodOptions = {};
    if (options.enableCache) {
      methodOptions.cache = options.cache;
      switch (methodName) {
        case 'api':
          // cache key will be the url of the api call:
          methodOptions.generateKey = function(genRequest, url) { return typeof url === 'string' ? url : url.url; };
          break;
        case 'method':
          // cache key will be the method name + the string representation of its arguments:
          methodOptions.generateKey = function(genRequest, method) {
            const name = typeof method === 'string' ? method : method.name;
            const argsString = method.args !== undefined ? JSON.stringify(method.args) : '';
            return `${name}-${argsString}`;
          };
          break;
        case 'inject':
          // cache key will be the path we're injecting to
          methodOptions.generateKey = function(genRequest, url) {
            return url;
          };
          break;
        default:
          break;
      }
    }
    server.method(`views.${methodName}`, require(`./methods/views/${methodName}.js`), methodOptions);
  });
  // register the fetch method:
  server.method('views.fetch', require('./methods/views/fetch.js'), {});
  //routes
  async.forEachOfSeries(options.views, (config, path, cb) => {
    config.options = options;
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
