'use strict';
/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');
const aug = require('aug');
const renderHandler = require('./lib/handler.js');
const serverMethods = ['api', 'inject', 'yaml', 'method'];
const defaults = {
  enableCache: false,
  serveStale: false,
  allowDebugQuery: true, //allows ?json=1
  routeConfig: {},
  debug: false,
  views: {}
};

const register = async (server, options) => {
  options = hoek.applyToDefaults(defaults, options);
  serverMethods.forEach((methodName) => {
    // todo: add caching options:
    const methodOptions = {};
    if (options.enableCache) {
      const defaultOptions = {};
      if (options.serveStale) {
        defaultOptions.dropOnError = false;
      }
      switch (methodName) {
        case 'api':
          // cache key will be the url of the api call:
          methodOptions.cache = Object.assign({}, defaultOptions, options.cache);
          methodOptions.generateKey = function(genRequest, url) {
            return typeof url === 'string' ? url : url.url;
          };
          break;
        case 'inject':
          // cache key will be the path we're injecting to
          methodOptions.cache = Object.assign({}, defaultOptions, options.cache);
          methodOptions.generateKey = function(genRequest, url) {
            return url;
          };
          break;
        default:
          break;
      }
    }
    server.method(`views.${methodName}`, require(`./methods/views/${methodName}.js`), methodOptions);
    // also register a cacheless version for routes that need it:
    server.method(`views.${methodName}_noCache`, require(`./methods/views/${methodName}.js`));
  });
  // register the fetch method:
  server.method('views.fetch', require('./methods/views/fetch.js'), {});
  //routes
  await new Promise((resolve, reject) => {
    async.forEachOfSeries(options.views, (config, path, cb) => {
      config.options = options;
      server.route({
        path,
        method: 'get',
        handler: renderHandler(config),
        config: aug({}, options.routeConfig, config.routeConfig || {})
      });
      cb();
    }, resolve);
  });
};

exports.plugin = {
  register,
  once: true,
  pkg: require('./package.json')
};
