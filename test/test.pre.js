'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('pre', () => {
  lab.test('preProcess', async() => {
    let processRan = false;

    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('process', (request, options, reply) => {
      processRan = true;
    });

    server.method('dummy', () => '1');

    await server.register([
      require('vision'),
      {
        plugin: require('../'),
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
    const response = await server.inject({ url: '/process' });
    expect(response.statusCode).to.equal(200);
    expect(processRan).to.equal(true);
  });
  lab.test('preProcess early reply', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('process', (request, options, reply) => {
      return { test: 2 };
    });

    server.method('dummy', () => '1');

    await server.register([
      require('vision'),
      {
        plugin: require('../'),
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
    await server.start();
    const response = await server.inject({ url: '/process' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.test).to.equal(2);
  });
  lab.test('preResponse', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('response', (request, options, data) => {
      return { test: 1 };
    });

    server.method('dummy', () => '1');

    await server.register([
      require('vision'),
      {
        plugin: require('../'),
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
    const response = await server.inject({ url: '/response' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.test).to.equal(1);
  });
});
