/* eslint consistent-return: 0, strict: 0 */
'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const wreck = require('wreck');
const async = require('async');
const varson = require('varson');
const Hoek = require('hoek');

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
        this.getMethod(config.method, cb);
      },
      inject: cb => {
        this.getInject(config.inject, request, cb);
      },
      data: ['inject', 'yaml', 'api', 'method', (results, cb) => {
        if (!config.data) {
          return done(null, results);
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
          return cb(response.statusMessage);
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

        return cb(null, payload);
      });
    }, done);
  }

  getMethod(methods, done) {
    let obj = methods;
    //convert method list into obj to use this.map
    if (Array.isArray(methods)) {
      obj = {};
      methods.forEach((method) => {
        obj[method] = method;
      });
    }
    this.map(obj, (method, name, cb) => {
      if (!this.server.methods[method]) {
        this.server.log(['error', 'hapi-views'], { error: 'Method not found', method });
        return cb(new Error('Method not found'));
      }

      this.server.methods[method](cb);
    }, done);
  }
}

module.exports = FetchData;
