/* eslint prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('redirect', () => {
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
          //debug: true,
          views: {
            '/redirect': {
              view: 'method',
              method: { var1: 'redirecttest' }
            }
          }
        }
      }], error => {
      Hoek.assert(!error, error);

      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });

      server.method('redirecttest', function(next) {
        next(null, {
          _redirect: '/redirecttest'
        });
      });

      server.start((err) => {
        Hoek.assert(!err, err);
        start();
      });
    });
  });
  // tests
  lab.test('redirect', done => {
    server.inject({
      url: '/redirect'
    }, response => {
      expect(response.statusCode).to.equal(302);
      done();
    });
  });
});
