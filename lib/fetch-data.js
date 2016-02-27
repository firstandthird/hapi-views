/* eslint consistent-return: 0, strict: 0 */
'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const wreck = require('wreck');
const async = require('async');
const hoek = require('hoek');

class FetchData {
  constructor(server) {
    this.server = server;
  }

  fetch(request, config, options, done) {
    async.auto({
      data: cb => {
        this.mapData(request, config.data, cb);
      },
      yaml: cb => {
        const yamlFile = path.join(options.dataPath, config.yaml);
        this.getYaml(yamlFile, cb);
      },
      api: cb => {
        this.getApi(config.api, cb);
      },
      method: cb => {
        this.getMethod(config.method, cb);
      }
    }, done);
  }

  mapData(request, data = [], done) {
    async.map(data, item => hoek.reach(request, item), done);
  }

  getYaml(file, done) {
    if (!file) {
      return done(null, {});
    }

    fs.readFile(file, 'utf8', (err, contents) => {
      if (err) {
        return done(err);
      }

      try {
        const obj = yaml.safeLoad(contents);
        return done(null, obj);
      } catch (e) {
        return done(e);
      }
    });
  }

  getApi(api, done) {
    wreck.get(api, (err, res, payload) => {
      if (err) {
        return done(err);
      }

      return done(null, payload);
    });
  }

  getMethod(method, done) {
    if (!this.server.methods[method]) {
      this.server.log(['error', 'hapi-views'], { error: 'Method not found', method });
      return done(new Error('Method not found'));
    }
    return this.server.methods[method](done);
  }
}

module.exports = FetchData;
