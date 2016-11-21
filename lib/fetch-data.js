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
          return done(null, results);
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
    }, (err, results) => {
      if (err) {
        return done(err);
      }
      done(null, results.data);
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

  getApi(apis, request, done) {
    this.map(apis, (api, name, cb) => {
      const obj = varson({
        url: api
      }, request);
      wreck.get(obj.url, { json: true }, (err, res, payload) => {
        if (err) {
          return cb(err);
        }
        if (res.statusCode !== 200) {
          return cb(Boom.create(res.statusCode, res.statusMessage, payload));
        }

        return cb(null, payload);
      });
    }, done);
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
