'use strict';
/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');
const aug = require('aug');
const renderHandler = require('./lib/handler.js');
const serverMethods = ['api', 'inject', 'yaml', 'method'];
const defaults = {
  allowJson: true, // adds the application/json mime type when query contains 'json=1'
  routeConfig: {},
  debug: false,
  views: {}
};

exports.register = function(server, options, next) {
  options = hoek.applyToDefaults(defaults, options);
  serverMethods.forEach((methodName) => {
    // todo: add caching options:
    const methodOptions = {};
    if (options.enableCache) {
      switch (methodName) {
        case 'api':
          // cache key will be the url of the api call:
          methodOptions.cache = Object.assign({}, options.cache);
          methodOptions.generateKey = function(genRequest, url) { return typeof url === 'string' ? url : url.url; };
          break;
        case 'inject':
          // cache key will be the path we're injecting to
          methodOptions.cache = Object.assign({}, options.cache);
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
