'use strict';
const boom = require('boom');
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
    let result;
    try {
      const data = varson(obj, { request, methods: request.server.methods }, viewConfig.options.varsonSettings);
      result = await pprops(data);
      if (viewConfig.preResponse) {
        viewConfig.preResponse(request, viewConfig.options, result);
      }
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
    const viewOutput = h.view(viewConfig.view, result);
    if (request.query.json === '1') {
      return viewOutput.type('application/json');
    }
    return viewOutput;
  };
};
