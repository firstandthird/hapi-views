'use strict';
const async = require('async');
const str2fn = require('str2fn');
const Boom = require('boom');
const aug = require('aug');

module.exports = (viewConfig) => (request, reply) => {
  async.autoInject({
    preProcess: done => {
      if (viewConfig.preProcess) {
        return str2fn(request.server.methods, viewConfig.preProcess)(request, viewConfig.options, reply, done);
      }
      return done();
    },
    locals: (preProcess, done) => {
      if (preProcess) {
        return done(null, false);
      }
      return request.server.methods.views.fetch(request, viewConfig, done);
    },
    globals: (preProcess, done) => {
      if (preProcess) {
        return done(null, false);
      }
      if (!viewConfig.options.globals) {
        return done(null, {});
      }
      return request.server.methods.views.fetch(request, Object.assign({ options: viewConfig.options }, viewConfig.options.globals), done);
    }
  }, (err, data) => {
    if (err) {
      if (typeof viewConfig.options.onError === 'function') {
        return viewConfig.options.onError(err, reply);
      }
      if (typeof viewConfig.onError === 'function') {
        return viewConfig.onError(err, reply);
      }
      if (typeof viewConfig.options.onError === 'string') {
        return str2fn(request.server.methods, viewConfig.options.onError)(err, reply);
      }
      if (typeof viewConfig.onError === 'string') {
        return str2fn(request.server.methods, viewConfig.onError)(err, reply);
      }
      // boom errs can be handed back directly:
      if (err.isBoom) {
        return reply(err);
      }
      return reply(Boom.boomify(err));
    }
    // Returned early in preProcess
    if (!data.globals && !data.locals) {
      return;
    }

    const combinedData = aug({}, data.globals, data.locals);
    if (viewConfig.options.debug) {
      request.server.log(['hapi-views', 'debug'], {
        data: combinedData,
        path: request.url.path
      });
    }
    if (viewConfig.options.allowDebugQuery && (request.query.json === '1' || request.query.debug === '1')) {
      return reply(combinedData).type('application/json');
    }

    if (viewConfig.preResponse) {
      return str2fn(request.server.methods, viewConfig.preResponse)(request, viewConfig.options, combinedData, reply, () => {
        reply.view(viewConfig.view, combinedData);
      });
    }
    const viewName = typeof viewConfig.view === 'function' ? viewConfig.view(combinedData) : viewConfig.view;
    return reply.view(viewName, combinedData);
  });
};
