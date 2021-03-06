'use strict';
/* eslint new-cap: 0 */
const aug = require('aug');
const renderHandler = require('./lib/handler.js');
const defaults = {
  allowDebugJson: true,
  routeConfig: {}
};

const register = (server, options) => {
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
