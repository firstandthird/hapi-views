'use strict';
const yaml = require('js-yaml');
const fs = require('fs');

module.exports = (request, yamlFile, done) => {
  fs.readFile(yamlFile, 'utf8', (err, contents) => {
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
};
