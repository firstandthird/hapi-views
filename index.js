'use strict';
/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');
const aug = require('aug');
const renderHandler = require('./lib/handler.js');
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
