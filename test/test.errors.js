/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('errors', () => {
  const server = new Hapi.Server({
    debug: { log: 'hapi-views' }
  });

  server.connection({ port: 9991 });

  lab.before(start => {
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          debug: true,
          views: {
            '/500': {
              view: 'api',
              api: { var1: 'http://localhost:9991/api/500' }
            },
            '/404': {
              view: 'api',
              api: { var1: 'http://localhost:9991/api/404' }
            }
          }
        }
      }], (error) => {
      Hoek.assert(!error, error);
      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });
      server.route({
        method: 'GET',
        path: '/api/500',
        handler(request, reply) {
          reply(new Error('testing'));
        }
      });
      server.route({
        method: 'GET',
        path: '/api/404',
        handler(request, reply) {
          reply({ status: 'not found' }).code(404);
        }
      });
      server.start((err) => {
        Hoek.assert(!err, err);
        start();
      });
    });
  });

  lab.test('500 errors bubble back up', (done) => {
    server.inject({
      url: '/500'
    }, (response) => {
      expect(response.statusCode).to.equal(500);
      done();
    });
  });

  lab.test('404 errors bubble back up', (done) => {
    server.inject({
      url: '/404'
    }, (response) => {
      expect(response.statusCode).to.equal(404);
      done();
    });
  });
});
