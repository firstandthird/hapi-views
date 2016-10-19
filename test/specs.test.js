/* eslint strict: 0, max-len: 0, no-console: 0, prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');

// test server
const Hapi = require('hapi');
const server = new Hapi.Server();

server.connection();

lab.experiment('specs', () => {
  lab.before(start => {
    // start server
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/yaml': {
              view: 'yaml',
              yaml: 'test1.yaml'
            },
            '/apitest': {
              view: 'api',
              api: 'http://jsonplaceholder.typicode.com/posts?id=1'
            },
            '/apivar/{id}': {
              view: 'api',
              api: 'http://jsonplaceholder.typicode.com/posts?id={{params.id}}'
            },
            '/methodtest': {
              view: 'method',
              method: 'testerino'
            },
            '/data': {
              view: 'data',
              yaml: 'test1.yaml',
              data: {
                name: 'Jack',
                url: '{{request.url.path}}',
                test: {
                  ok: '{{yaml[0].test1}}'
                }
              }
            }
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

      server.start((err) => {
        Hoek.assert(!err, err);
        console.log(`Server started at: ${server.info.uri}`);
        start();
      });
    });
  });

  // tests
  lab.test('yaml', done => {
    server.inject({
      url: '/yaml'
    }, response => {
      Hoek.assert(response.result.indexOf('true') !== -1, 'Expected output not found');
      done();
    });
  });

  lab.test('api', done => {
    server.inject({
      url: '/apitest'
    }, response => {
      Hoek.assert(response.result.indexOf('1') !== -1, 'Expected output not found');
      done();
    });
  });

  lab.test('api with variables', done => {
    server.inject({
      url: '/apivar/1'
    }, response => {
      Hoek.assert(response.result.indexOf('1') !== -1, 'Expected output not found');
      done();
    });
  });


  lab.test('method', done => {
    server.inject({
      url: '/methodtest'
    }, response => {
      Hoek.assert(response.result.indexOf('test') !== -1, 'Expected output not found');
      done();
    });
  });

  lab.test('data', done => {
    server.inject({
      url: '/data'
    }, response => {
      Hoek.assert(response.result.indexOf('Jack') !== -1, 'Expected output not found');
      Hoek.assert(response.result.indexOf('/data') !== -1, 'Expected output not found');
      Hoek.assert(response.result.indexOf('true') !== -1, 'Expected output not found');
      done();
    });
  });
});
