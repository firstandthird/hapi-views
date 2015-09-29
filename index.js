var _ = require('lodash');

var fetchData = require('./lib/fetch-data');

var defaults = {
  views: {}
};

exports.register = function(server, options, next) {

  options = _.defaults(options, defaults);

  var renderHandler = function(viewConfig) {

    return function(request, reply) {

      fetchData(viewConfig, options, function(err, data) {

        if (err) {
          return reply(err);
        }

        reply.view(viewConfig.view, data);

      });
    };

  };

  //routes
  _.forIn(options.views, function(config, path) {

    server.route({
      path: path,
      method: 'get',
      handler: renderHandler(config),
      config: {
        cache: options.cache
      }
    });

  });


  next();
};

exports.register.attributes = {
  name: 'views',
  pkg: require('./package.json')
};
