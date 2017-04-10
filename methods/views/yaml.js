'use strict';
const path = require('path');
const map = require('../../lib/map.js');
const yaml = require('js-yaml');
const fs = require('fs');

module.exports = (request, files, yamlPath, done) => {
  map(files, (file, name, cb) => {
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
};
