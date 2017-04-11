/* eslint prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');
const EOL = require('os').EOL;

lab.experiment('injects', () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.connection();
  lab.before(start => {
    // start server
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          // debug: true,
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/apivar/{id}': {
              view: 'api',
              api: { var1: 'http://jsonplaceholder.typicode.com/posts?id={params.id}' }
            },
            '/inject': {
              inject: { api: '/api' },
              view: 'data'
            },
            '/injectmap': {
              inject: {
                api: '/api',
                apivar: '/apivar/1'
              },
              view: 'data'
            },
          }
        }
      }], error => {
      Hoek.assert(!error, error);

      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });

      server.route({
        method: 'GET',
        path: '/api',
        handler(request, reply) {
          reply({ test: true });
        }
      });

      server.method('testerino', function(next) {
        next(null, 'test');
      });

      server.method('testmethod2', function(next) {
        next(null, 'test2');
      });

      server.method('myScope.myMethod', function(next) {
        next(null, 'test3');
      });
      server.start((err) => {
        Hoek.assert(!err, err);
        start();
      });
    });
  });
  // tests
  lab.test('inject', done => {
    server.inject({
      url: '/inject'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        yaml: {},
        api: {},
        method: {},
        inject: { api: { test: true } }
      });
      done();
    });
  });
  lab.test('injectmap', done => {
    server.inject({
      url: '/injectmap'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        yaml: {},
        api: {},
        method: {},
        inject: {
          api: { test: true },
          apivar: `1${EOL}`
        }
      });
      done();
    });
  });
  lab.test('?json=1', done => {
    server.inject({
      url: '/injectmap?json=1'
    }, response => {
      expect(response.headers['content-type']).to.contain('application/json');
      const context = response.result;
      expect(context).to.equal({
        yaml: {},
        api: {},
        method: {},
        inject: {
          api: { test: true },
          apivar: `1${EOL}`
        }
      });
      done();
    });
  });
});

lab.experiment('disable ?json=1', () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.connection();
  lab.before(start => {
    // start server
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          // debug: true,
          allowJson: false,
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/apivar/{id}': {
              view: 'api',
              api: { var1: 'http://jsonplaceholder.typicode.com/posts?id={params.id}' }
            },
            '/inject': {
              inject: { api: '/api' },
              view: 'data'
            },
            '/injectmap': {
              inject: {
                api: '/api',
                apivar: '/apivar/1'
              },
              view: 'data'
            },
          }
        }
      }], error => {
      Hoek.assert(!error, error);

      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });

      server.route({
        method: 'GET',
        path: '/api',
        handler(request, reply) {
          reply({ test: true });
        }
      });

      server.start((err) => {
        Hoek.assert(!err, err);
        start();
      });
    });
  });
  // tests
  lab.test('inject', done => {
    server.inject({
      url: '/inject?json=1'
    }, response => {
      expect(response.headers['content-type']).to.contain('text/html');
      done();
    });
  });
});
