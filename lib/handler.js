'use strict';
const boom = require('boom');
const str2fn = require('str2fn');
const aug = require('aug');
const pprops = require('p-props');
const varson = require('varson');

module.exports = (viewConfig) => {
  return async (request, h) => {
    if (viewConfig.preProcess) {
      viewConfig.preProcess(request, viewConfig.options, h);
    }
    // aug with globals:
    const obj = aug({}, viewConfig.data, viewConfig.options.globals);
    try {
      const data = varson(obj, { request, methods: request.server.methods });
      const result = await pprops(data);
      return h.view(viewConfig.view, result);
    } catch (err) {
      if (typeof viewConfig.onError === 'function') {
        return viewConfig.onError(err);
      }
      if (typeof viewConfig.options.onError === 'function') {
        return viewConfig.options.onError(err);
      }
      if (err.isBoom) {
        throw err;
      }
      throw boom.boomify(err);
    }
  };
};
