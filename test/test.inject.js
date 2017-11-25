/* eslint prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');
const EOL = require('os').EOL;
const boom = require('boom');

lab.experiment('injects', () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  lab.before(async () => {
    // start server
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
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
            '/injecterr': {
              inject: { api: '/apiError' },
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });

    server.route({
      method: 'GET',
      path: '/api',
      handler(request, reply) {
        expect(request.info.referrer).to.equal('refererWithTwoRs');
        expect(request.headers).to.include('user-agent');
        return { test: true };
      }
    });

    server.method('testerino', function() {
      return 'test';
    });

    server.method('testmethod2', function() {
      return 'test2';
    });

    server.method('myScope.myMethod', function() {
      return 'test3';
    });
    server.route({
      method: 'GET',
      path: '/apiError',
      handler(request, h) {
        throw boom.locked('go away');
      }
    });
    await server.start();
  });

  // tests
  lab.test('inject', async () => {
    const response = await server.inject({
      url: '/inject',
      headers: {
        referer: 'refererWithTwoRs'
      }
    });
    const context = response.request.response.source.context;
    expect(context).to.equal({
      yaml: {},
      api: {},
      method: {},
      inject: { api: { test: true } }
    });
  });
  lab.test('injecterr', async() => {
    const response = await server.inject({
      url: '/injecterr',
      headers: {
        referer: 'refererWithTwoRs'
      }
    });
    // make sure error message and friendly error passed up:
    expect(response.statusCode).to.equal(423);
    expect(response.result.message).to.equal('go away');
  });
  lab.test('injectmap', async () => {
    const response = await server.inject({
      url: '/injectmap',
      headers: {
        referer: 'refererWithTwoRs'
      }
    });
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
  });
  lab.test('?json=1', async () => {
    const response = await server.inject({
      url: '/injectmap?json=1',
      headers: {
        referer: 'refererWithTwoRs'
      }
    });
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
  });
});

lab.experiment('disable ?json=1', () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  lab.before(async () => {
    // start server
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          // debug: true,
          allowDebugQuery: false,
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    server.route({
      method: 'GET',
      path: '/api',
      handler(request, h) {
        return { test: true };
      }
    });
    await server.start();
  });
  // tests
  lab.test('inject', async () => {
    const response = await server.inject({ url: '/inject?json=1' });
    expect(response.headers['content-type']).to.contain('text/html');
  });
});
