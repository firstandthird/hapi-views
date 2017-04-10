'use strict';
const async = require('async');
const getData = require('./data.js');
const path = require('path');
const Hoek = require('hoek');

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
        request.server.methods.views[methodData.type](request, methodData.data, (err, result) => {
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
