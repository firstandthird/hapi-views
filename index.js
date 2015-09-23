var _ = require('lodash');
var Handlebars = require('handlebars');

var fetchData = require('./lib/fetch-data');

var defaults = {
  cacheViews: true,
  views: {}
};

exports.register = function(server, options, next) {

  options = _.defaults(options, defaults);

  var renderHandler = function(request, reply) {

    var viewConfig = options.views[request.route.path];

    fetchData(viewConfig, options, function(err, data) {

      if (err) {
        return reply(err);
      }

      reply.view(viewConfig.view, data);

    });

  };

  //routes
  _.forIn(options.views, function(config, path) {

    server.route({
      path: path,
      method: 'get',
      handler: renderHandler
    });

  });

  server.expose('addHelper', function(name, fn) {
    Handlebars.registerHelper(name, fn);
  });

  server.register({
    register: require('vision')
  }, function(err) {

    if (err) {
      return next(err);
    }

    server.views({
      engines: { html: Handlebars },
      path: options.viewsPath,
      helpersPath: options.helpersPath,
      partialsPath: options.partialsPath,
      isCached: options.cacheViews
    });


    next();

  });

};

exports.register.attributes = {
  name: 'views',
  pkg: require('./package.json')
};
