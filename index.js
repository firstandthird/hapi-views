'use strict';
/* eslint new-cap: 0 */
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
  options = Object.assign({}, defaults, options);
  Object.keys(options.routes).forEach((path) => {
    const config = options.routes[path];
    config.options = options;
    server.route({
      path,
      method: 'get',
      handler: renderHandler(config),
      config: aug({}, options.routeConfig, config.routeConfig || {})
    });
  });
};

exports.plugin = {
  register,
  once: true,
  pkg: require('./package.json')
};
