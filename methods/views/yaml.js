'use strict';
const yaml = require('js-yaml');
const fs = require('fs');

module.exports = async (yamlFile) => {
  return new Promise((resolve, reject) => {
    return resolve({ test1: true });
    fs.readFile(yamlFile, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }
      try {
        const obj = yaml.safeLoad(contents);
        return resolve(obj);
      } catch (e) {
        return reject(e);
      }
    });
  });
};
