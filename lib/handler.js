'use strict';
const boom = require('boom');
const str2fn = require('str2fn');
const aug = require('aug');
const pprops = require('p-props');
const varson = require('varson');

module.exports = (viewConfig) => {
  return async (request, h) => {
    // aug with globals:
    const obj = aug({}, viewConfig.data, viewConfig.globals);
    obj.request = request;
    obj.methods = request.server.methods;
    try {
      const data = varson(obj);//, { request, methods: request.server.methods });
      const result = await pprops(data);
      return h.view(viewConfig.view, result.pprops);
    } catch (err) {
      if (typeof viewConfig.options.onError === 'function') {
        viewConfig.options.onError(err);
      }
      if (typeof viewConfig.options.onError === 'string') {
        str2fn(request.server.methods, viewConfig.options.onError)(err);
      }
      if (err.isBoom) {
        throw err;
      }
      throw boom.boomify(err);
    }
  };
};
