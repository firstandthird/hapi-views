'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('onError', () => {
  lab.test('top-level onError', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('makeError', (next) => next(new Error('this is an error')));
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          onError: (err, reply) => {
            expect(err).to.not.equal(null);
            return reply('the error was handled');
          },
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: {
                error: 'makeError'
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
        url: '/throwError'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal('the error was handled');
        done();
      });
    });
  });
  lab.test('top-level onError as server method', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('makeError', (next) => next(new Error('this is an error')));
    server.method('fetchError', (err, reply) => {
      expect(err).to.not.equal(null);
      return reply('the error was handled');
    });
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          onError: 'fetchError',
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: {
                makeError: 'makeError'
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
        url: '/throwError'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal('the error was handled');
        done();
      });
    });
  });
  lab.test('per-route onError', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('makeError', (next) => next(new Error('this is an error')));
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          // debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: {
                error: 'makeError',
              },
              onError: (err, reply) => {
                expect(err).to.not.equal(null);
                return reply('the error was handled');
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
        url: '/throwError'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal('the error was handled');
        done();
      });
    });
  });
  lab.test('per-route onError as server method', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('makeError', (next) => next(new Error('this is an error')));
    server.method('fetchError', (err, reply) => {
      expect(err).to.not.equal(null);
      return reply('the error was handled');
    });
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: {
                error: 'makeError',
              },
              onError: 'fetchError'
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
        url: '/throwError'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal('the error was handled');
        done();
      });
    });
  });
});
