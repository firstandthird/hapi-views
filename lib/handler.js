'use strict';
const boom = require('boom');
const aug = require('aug');
const process = require('hapi-process-data');

module.exports = function(viewConfig) {
  return async function (request, h) {
    if (viewConfig.preProcess) {
      const result = viewConfig.preProcess(request, viewConfig.options, h);
      if (typeof result === 'object' && result.variety === 'plain') {
        return result;
      }
    }
    // aug with globals:
    const obj = aug({}, viewConfig.data, viewConfig.options.globals);
    let result;

    try {
      const context = aug({}, request.server.methods, { request }, obj);
      const debug = (request.query.debug === 1);
      const log = (msg) => {
        request.server.log(['hapi-views', 'process-data'], msg);
      };
      result = await process(obj, context, debug, log);
      if (viewConfig.preResponse) {
        // if preresponse returns a value, use that as the response value:
        const response = viewConfig.preResponse(request, viewConfig.options, result, h);
        if (response) {
          return response;
        }
      }
    } catch (err) {
      if (typeof viewConfig.onError === 'function') {
        return viewConfig.onError(err, request, h);
      }
      if (typeof viewConfig.options.onError === 'function') {
        return viewConfig.options.onError(err, request, h);
      }
      if (err.isBoom) {
        throw err;
      }
      throw boom.boomify(err);
    }
    if (viewConfig.options.allowDebugJson && request.query.json === '1') {
      return h.response(result).type('application/json');
    }
    const viewOutput = h.view(viewConfig.view, result);
    return viewOutput;
  };
};
