var _ = require('lodash');

var fetchData = require('./lib/fetch-data');

var defaults = {
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


  next();
};

exports.register.attributes = {
  name: 'views',
  pkg: require('./package.json')
};
