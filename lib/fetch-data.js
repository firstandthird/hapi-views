/* eslint consistent-return: 0, strict: 0 */
'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const wreck = require('wreck');
const async = require('async');
const varson = require('varson');

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
      data: ['yaml', 'api', 'method', (results, cb) => {
        if (!config.data) {
          return done(null, results);
        }
        const out = varson(config.data, Object.assign({}, results, { request }));
        cb(null, out);
      }],
    }, (err, results) => {
      if (err) {
        return done(err);
      }
      done(null, results.data);
    });
  }

  getYaml(files, yamlPath, done) {
    if (!files) {
      return done(null, {});
    }

    if (!Array.isArray(files)) {
      files = [files];
    }

    async.map(files, (file, cb) => {
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
    }, (err, results) => {
      if (err) {
        return done(err);
      }

      done(null, results);
    });
  }

  getApi(apis, request, done) {
    if (!apis) {
      return done(null, {});
    }

    if (!Array.isArray(apis)) {
      apis = [apis];
    }

    async.map(apis, (api, cb) => {
      const obj = varson({
        url: api
      }, request);
      wreck.get(obj.url, { json: true }, (err, res, payload) => {
        if (err) {
          return cb(err);
        }

        return cb(null, payload);
      });
    }, (err, results) => {
      if (err) {
        return done(err);
      }

      done(null, results);
    });
  }

  getMethod(methods, done) {
    if (!methods) {
      return done(null, {});
    }

    if (!Array.isArray(methods)) {
      methods = [methods];
    }

    async.map(methods, (method, cb) => {
      if (!this.server.methods[method]) {
        this.server.log(['error', 'hapi-views'], { error: 'Method not found', method });
        return cb(new Error('Method not found'));
      }

      this.server.methods[method](cb);
    }, (err, results) => {
      if (err) {
        return done(err);
      }

      done(null, results);
    });
  }
}

module.exports = FetchData;
