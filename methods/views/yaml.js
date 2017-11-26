'use strict';
const yaml = require('js-yaml');
const fs = require('fs');

module.exports = async (yamlFile) => {
  return new Promise((resolve, reject) => {
    /// why this no load?
    /// why this no load?
    /// why this no load?
    /// why this no load?
    /// why this no load? path is correct
    console.log(yamlFile)
    // this is a placeholder:
    // this is a placeholder:
    // this is a placeholder:
    return resolve({ test1: true });
    fs.readFile(yamlFile, 'utf8', (err, contents) => {
      console.log('+')
      console.log('+')
      console.log('+')
      console.log(err)
      console.log(contents)
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
