'use strict';
const async = require('async');
const getData = require('./data.js');
const path = require('path');
const Hoek = require('hoek');
const varson = require('varson');
const varsonSettings = { start: '{', end: '}' };

const serverMethods = ['api', 'inject', 'method', 'yaml'];
module.exports = (request, config, allDone) => {
  // set up an object to keep track of results:
  const out = {};
  serverMethods.forEach((methodName) => {
    out[methodName] = {};
  });
  // populate 'out':
  async.autoInject({
    methodArray(done) {
      // get an array of objects, each with the 'type' property to specify the server method to use:
      const methodArray = [];
      serverMethods.forEach((methodName) => {
        const methodConfig = config[methodName] || {};
        Object.keys(methodConfig).forEach((key) => {
          const method = { type: methodName, key, data: methodConfig[key] };
          methodArray.push(method);
        });
      });
      return done(null, methodArray);
    },
    populateOutput(methodArray, done) {
      async.map(methodArray, (methodData, mapDone) => {
        // the yaml method needs to know the location of the yaml file before calling:
        if (methodData.type === 'yaml') {
          methodData.data = path.join(config.options.dataPath, methodData.data);
        }
        // any url-consuming methods need their url resolved first:
        if (methodData.type === 'api') {
          if (typeof methodData.data === 'string') {
            methodData.data = varson({ url: methodData.data }, request, varsonSettings).url;
          } else {
            methodData.data.url = varson({ url: methodData.data.url }, request, varsonSettings).url;
          }
        }
        if (methodData.type === 'inject') {
          methodData.data = varson({ url: methodData.data }, request, varsonSettings).url;
        }
        const methodName = config.enableCache === false ? `${methodData.type}_noCache` : methodData.type;
        request.server.methods.views[methodName](request, methodData.data, (err, result, cacheData) => {
          if (err && config.options.serveStale && cacheData) {
            request.server.log(['hapi-views', 'fetch'], {err, message: `${methodName} returned an error. Serving stale content`});
            err = null;
          }
          out[methodData.type][methodData.key] = result;
          return mapDone(err, out);
        });
      }, done);
    },
    data(populateOutput, done) {
      getData(request, config.data, out, (err, dataResult) => {
        if (err) {
          return allDone(err);
        }
        if (dataResult) {
          return done(null, dataResult);
        }
        return done(null, out);
      });
    },
    dataMethod(data, done) {
      if (!config.dataMethod) {
        return done();
      }
      const serverMethod = Hoek.reach(request.server.methods, config.dataMethod);
      if (!serverMethod) {
        return done(new Error(`${serverMethod} is not a server method`));
      }
      serverMethod(data, done);
    }
  }, (err, results) => {
    if (err) {
      return allDone(err);
    }
    if (results.dataMethod) {
      return allDone(null, results.dataMethod);
    }
    return allDone(null, results.data);
  });
};
