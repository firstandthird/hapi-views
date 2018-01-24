'use strict';
const boom = require('boom');
const aug = require('aug');
const pprops = require('p-props');
const varson = require('varson');

module.exports = (viewConfig) => async (request, h) => {
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
  if (viewConfig.options.allowJson && request.query.json === '1') {
    return h.response(result).type('application/json');
  }
  const viewOutput = h.view(viewConfig.view, result);
  return viewOutput;
};
