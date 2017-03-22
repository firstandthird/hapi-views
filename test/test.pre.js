'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('pre', () => {
  lab.test('preProcess', (done) => {
    let processRan = false;

    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('process', (request, options, reply, next) => {
      processRan = true;
      next();
    });

    server.method('dummy', next => next());

    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          views: {
            '/process': {
              view: 'api',
              preProcess: 'process',
              method: {
                dummy: 'dummy'
              }
            }
          }
        }
      }], (error) => {
      Hoek.assert(!error, error);
      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });
    });
    server.start(() => {
      server.inject({
        url: '/process'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(processRan).to.equal(true);
        done();
      });
    });
  });
  lab.test('preProcess early reply', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('process', (request, options, reply, next) => {
      reply({ test: 2 });
      next(null, true);
    });

    server.method('dummy', next => next());

    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          views: {
            '/process': {
              view: 'api',
              preProcess: 'process',
              method: {
                dummy: 'dummy'
              }
            }
          }
        }
      }], (error) => {
      Hoek.assert(!error, error);
      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });
    });
    server.start(() => {
      server.inject({
        url: '/process'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result.test).to.equal(2);
        done();
      });
    });
  });
  lab.test('preResponse', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('response', (request, options, data, reply) => {
      reply({ test: 1 });
    });

    server.method('dummy', next => next());

    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          views: {
            '/response': {
              view: 'api',
              preResponse: 'response',
              method: {
                dummy: 'dummy'
              }
            }
          }
        }
      }], (error) => {
      Hoek.assert(!error, error);
      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });
    });
    server.start(() => {
      server.inject({
        url: '/response'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result.test).to.equal(1);
        done();
      });
    });
  });
});
