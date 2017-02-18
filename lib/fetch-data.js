/* eslint consistent-return: 0, strict: 0 */
'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const wreck = require('wreck');
const async = require('async');
const varson = require('varson');
const Hoek = require('hoek');
const Boom = require('boom');

varson.settings.start = '{';
varson.settings.end = '}';

class FetchData {
  constructor(server) {
    this.server = server;
  }

  fetch(request, config, options, done) {
    async.auto({
      yaml: cb => {
        this.getYaml(config.yaml, options.dataPath, cb);
      },
      api: cb => {
        this.getApi(config.api, request, cb);
      },
      method: cb => {
        this.getMethod(config.method, request, cb);
      },
      inject: cb => {
        this.getInject(config.inject, request, cb);
      },
      data: ['inject', 'yaml', 'api', 'method', (results, cb) => {
        if (!config.data) {
          return cb(null);
        }
        if (typeof config.data === 'string') {
          return cb(null, results[config.data]);
        }
        const data = Hoek.clone(config.data);
        const context = Hoek.clone(results);
        context.request = request;
        const out = varson(data, context);
        cb(null, out);
      }],
      dataMethod: ['data', (results, cb) => {
        if (!config.dataMethod) {
          return cb(null);
        }
        const method = Hoek.reach(this.server.methods, config.dataMethod);
        if (!method) {
          return cb(new Error(`${method} is not a server method`));
        }
        method(results.data || results, cb);
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
  }

  map(input, method, done) {
    if (!input) {
      return done(null, {});
    }
    if (typeof input === 'string') {
      input = { _: input };
    }
    async.mapValues(input, method, (err, results) => {
      if (err) {
        return done(err);
      }
      if (results._) {
        return done(null, results._);
      }
      done(null, results);
    });
  }

  getYaml(files, yamlPath, done) {
    this.map(files, (file, name, cb) => {
      const yamlFile = path.join(yamlPath, file);
      fs.readFile(yamlFile, 'utf8', (err, contents) => {
        if (err) {
          return cb(err);
        }

        try {
          const obj = yaml.safeLoad(contents);
          return cb(null, obj);
        } catch (e) {
          return cb(e);
        }
      });
    }, done);
  }

  getInject(urls, request, done) {
    const server = request.server;
    this.map(urls, (url, name, cb) => {
      const obj = varson({
        url
      }, request);
      server.inject(obj, (response) => {
        if (response.statusCode !== 200) {
          return cb(Boom.create(response.statusCode, response.statusMessage));
        }
        return cb(null, response.result);
      });
    }, done);
  }

  getApi(apis, request, allDone) {
    if (!apis) {
      return allDone(null, {});
    }
    async.mapValues(apis, (api, varName, done) => {
      const options = { json: true };
      if (api.headers) {
        options.headers = api.headers;
      }
      const url = (typeof api === 'string') ? varson({ url: api }, request).url : varson({ url: api.url }, request).url;
      wreck.get(url, options, (err, res, payload) => {
        if (err) {
          return done(err);
        }
        if (res.statusCode !== 200) {
          return done(Boom.create(res.statusCode, res.statusMessage, payload));
        }
        return done(null, payload);
      });
    }, (err, all) => {
      allDone(err, all);
    });
  }

  getMethod(methods, request, done) {
    //convert method list into obj to use this.map
    let obj = {};
    if (Array.isArray(methods)) {
      methods.forEach((method) => {
        if (typeof method === 'string') {
          obj[method] = method;
        } else {
          //method = { name: 'name', args: [] }
          obj[method.name] = method;
        }
      });
    } else if (typeof methods === 'object' && methods.name) {
      //if single object
      obj._ = methods;
    } else {
      //single string
      obj = methods;
    }
    this.map(obj, (method, name, cb) => {
      const methodName = typeof method === 'string' ? method : method.name;
      const reached = Hoek.reach(this.server.methods, methodName);
      if (!reached) {
        this.server.log(['error', 'hapi-views'], { error: 'Method not found', method });
        return cb(new Error('Method not found'));
      }
      if (method.args) {
        const args = varson({ args: Hoek.clone(method.args) }, { request: Hoek.clone(request) }).args;
        args.push(cb);
        reached.apply(this.server, args);
      } else {
        reached(cb);
      }
    }, done);
  }
}

module.exports = FetchData;
