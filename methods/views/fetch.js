'use strict';
const async = require('async');
const data = require('./data.js');
const path = require('path');

const serverMethods = ['api', 'inject', 'method', 'yaml'];
module.exports = (request, config, allDone) => {
  const out = {};
  serverMethods.forEach((methodName) => {
    out[methodName] = {};
  });
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
    results(methodArray, done) {
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
    data(results, done) {
      data(request, config.data, out, (err, dataResult) => {
        if (err) {
          return allDone(err);
        }
        if (dataResult) {
          return done(null, dataResult);
        }
        return done(null, out);
      });
    }
  }, (err, results) => {
    if (err) {
      return allDone(err);
    }
    return allDone(null, results.data);
  });
};

  /*
  async.auto({
    yaml: cb => yaml(request, config.yaml, config.options.dataPath, cb),
    data: ['inject', 'yaml', 'api', 'method', (results, cb) => {
    }],
    dataMethod: ['data', (results, cb) => {
      if (!config.dataMethod) {
        return cb(null);
      }
      const serverMethod = Hoek.reach(request.server.methods, config.dataMethod);
      if (!serverMethod) {
        return cb(new Error(`${serverMethod} is not a server method`));
      }
      serverMethod(results.data || results, cb);
    }]
  }, (err, results) => {
    if (err) {
      return done(err);
    }
    if (results.dataMethod) {
      return done(null, results.dataMethod);
    }
    delete results.dataMethod;
    if (results.data) {
      return done(null, results.data);
    }
    delete results.data;
    done(null, results);
  });
};
*/
