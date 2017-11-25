'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('onError', () => {
  lab.test('top-level onError', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('makeError', () => { throw new Error('this is an error'); });
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          onError: (err, h) => {
            expect(err).to.not.equal(null);
            return 'the error was handled';
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
    const response = await server.inject({ url: '/throwError' });
    expect(response.statusCode).to.equal(200);
    expect(response.result).to.equal('the error was handled');
  });

  lab.test('top-level onError as server method', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('makeError', (next) => next(new Error('this is an error')));
    server.method('fetchError', (err, h) => {
      expect(err).to.not.equal(null);
      return 'the error was handled';
    });
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
    const response = await server.inject({ url: '/throwError' });
    expect(response.statusCode).to.equal(200);
    expect(response.result).to.equal('the error was handled');
  });
  lab.test('per-route onError', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('makeError', () => { throw new Error('this is an error'); });
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
    const response = await server.inject({ url: '/throwError' });
    expect(response.statusCode).to.equal(200);
    expect(response.result).to.equal('the error was handled');
  });
  lab.test('per-route onError as server method', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('makeError', () => { throw new Error('this is an error') });
    server.method('fetchError', (err, h) => {
      expect(err).to.not.equal(null);
      return 'the error was handled';
    });
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
    const response = await server.inject({ url: '/throwError' });
    expect(response.statusCode).to.equal(200);
    expect(response.result).to.equal('the error was handled');
  });

});
