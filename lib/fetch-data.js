var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');


var getYaml = function(file, done) {

  if (!file) {
    return done(null, {});
  }

  fs.readFile(file, 'utf8', function(err, contents) {
    if (err) {
      return done(err);
    }

    try {
      var obj = yaml.safeLoad(contents);
      return done(null, obj);
    } catch(e) {
      return done(e);
    }
  });

};

module.exports = function(config, options, done) {


  var yamlFile = path.join(options.dataPath, config.yaml);
  getYaml(yamlFile, done);

  //TODO: methods and http requests


};
