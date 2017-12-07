'use strict';
/* eslint new-cap: 0 */
const async = require('async');
const hoek = require('hoek');
const aug = require('aug');
const renderHandler = require('./lib/handler.js');
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
  //routes
  async.forEachOfSeries(options.routes, (config, path, cb) => {
    config.options = options;
    server.route({
      path,
      method: 'get',
      handler: renderHandler(config),
      config: aug({}, options.routeConfig, config.routeConfig || {})
    });
    cb();
  });
};

exports.plugin = {
  register,
  once: true,
  pkg: require('./package.json')
};
