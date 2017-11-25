'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');
const Boom = require('boom');

let server;
lab.experiment('api', () => {
  server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' },
    port: 9991
  });
  let callCount = 0;

  lab.before( async () => {
    // start server
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          //debug: true,
          enableCache: true,
          serveStale: true,
          cache: {
            expiresIn: 60000,
            staleIn: 2000,
            staleTimeout: 200,
            generateTimeout: 100
          },
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/apitest': {
              view: 'api',
              api: { key1: 'http://localhost:9991/testRoute', key2: { url: 'http://localhost:9991/testRoute2' } }
            },
            '/apitestNocache': {
              view: 'api',
              enableCache: false,
              api: { key1: 'http://localhost:9991/testRouteNoCache' }
            },
            '/apitestfail': {
              view: 'api',
              api: { key1: 'http://localhost:9991/testFailRoute' }
            },
            '/injecttest': {
              view: 'api',
              inject: { var1: '/injectRoute' },
            },
            '/injecttestNocache': {
              view: 'api',
              enableCache: false,
              inject: { key1: 'http://localhost:9991/testInjectNoCache' }
            },
            '/apiParams/': {
              view: 'api',
              api: {
                var1: 'http://localhost:9991/checkUrl/{info.received}'
              }
            },
            '/injectParams/': {
              view: 'api',
              inject: {
                var1: '/checkUrlInject/{info.received}'
              }
            },
          }
        }
    }]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
  });
  lab.after(async () => {
    await server.stop();
  });

  lab.test('api', async () => {
    let callCount = 0;
    server.route({
      method: 'GET',
      path: '/testRoute',
      handler(request, h) {
        callCount ++;
        return { test: true };
      }
    });
    server.route({
      method: 'GET',
      path: '/testRoute2',
      handler(request, h) {
        return { test2: '1' };
      }
    });
    const response = await server.inject({
      url: '/apitest'
    });
    const context = response.request.response.source.context;
    expect(context.api.key1).to.equal({ test: true });
    const response2 = await server.inject({
      url: '/apitest'
    });
    const context2 = response.request.response.source.context;
    expect(context2.api.key1).to.equal({ test: true });
    expect(context2.api.key2).to.equal({ test2: '1' });
    expect(callCount).to.equal(1);
  });

  lab.test('api with route params', async () => {
    callCount = 0;
    const ids = [];
    server.route({
      method: 'GET',
      path: '/checkUrl/{requestId}',
      handler(request, h) {
        callCount ++;
        ids.push(request.params.requestId);
        return { test: true };
      }
    });
    const response = await server.inject({ url: '/apiParams/' });
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(1000);
    const response2 = await server.inject({
      url: '/apiParams/'
    });
    expect(callCount).to.equal(2);
    expect(ids[0]).to.not.equal(ids[1]);
  });

  lab.test('api with cache disabled', async () => {
    let callCount = 0;
    server.route({
      method: 'GET',
      path: '/testRouteNoCache',
      handler(request, h) {
        callCount ++;
        return { test: true };
      }
    });
    const response = await server.inject({
      url: '/apitestNocache'
    });
    const context = response.request.response.source.context;
    expect(context.api.key1).to.equal({ test: true });
    const response2 = await server.inject({
      url: '/apitestNocache'
    });
    const context2 = response.request.response.source.context;
    expect(context2.api.key1).to.equal({ test: true });
    expect(callCount).to.equal(2);
  });

  lab.test('nocache=1 will bypass caching', async() => {
    const respnose = await server.inject({
      url: '/apitest?nocache=1'
    });
    const context = response.request.response.source.context;
    expect(context.api.key1).to.equal({ test: true });
    const response2 = await server.inject({
      url: '/apitest?nocache=1'
    });
    const context2 = response.request.response.source.context;
    expect(context2.api.key1).to.equal({ test: true });
    expect(context2.api.key2).to.equal({ test2: '1' });
    expect(callCount).to.equal(2);
  });

  lab.test('api test with api fail', { timeout: 3500 }, async () => {
    let firstRun = true;
    server.route({
      method: 'GET',
      path: '/testFailRoute',
      handler(req, reply) {
        if (!firstRun) {
          throw Boom.badImplementation('Random Error Message');
        }

        firstRun = false;
        return { one: 'une', two: 'deu' };
      }
    });
    const resp = await server.inject({
      method: 'GET',
      url: '/apitestfail'
    });
    const context = resp.request.response.source.context;
    expect(context.api.key1).to.equal({ one: 'une', two: 'deu' });
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(3000);
    const resp2 = await server.inject({
      method: 'GET',
      url: '/apitestfail'
    });
    const contextDeu = resp2.request.response.source.context;
    expect(contextDeu.api.key1).to.equal({ one: 'une', two: 'deu' });
  });

  lab.test('inject', async () => {
    callCount = 0;
    server.route({
      method: 'GET',
      path: '/injectRoute',
      handler(request, h) {
        callCount ++;
        return { test: true };
      }
    });
    const response = await server.inject({
      method: 'GET',
      url: '/injecttest'
    });
    const context = response.request.response.source.context;
    expect(context.inject.var1).to.equal({ test: true });
    const response2 = await server.inject({
      url: '/injecttest'
    });
    const context2 = response.request.response.source.context;
    expect(context2.inject.var1).to.equal({ test: true });
    expect(callCount).to.equal(1);
  });

  lab.test('inject with cache disabled', async () => {
    callCount = 0;
    server.route({
      method: 'GET',
      path: '/testInjectNoCache',
      handler(request, h) {
        callCount ++;
        return { test: true };
      }
    });
    const response = await server.inject({
      url: '/injecttestNocache'
    });
    const context = response.request.response.source.context;
    expect(context.inject.key1).to.equal({ test: true });
    const response2 = await server.inject({
      url: '/injecttestNocache'
    });
    const context2 = response.request.response.source.context;
    expect(context2.inject.key1).to.equal({ test: true });
    expect(callCount).to.equal(2);
  });

  lab.test('inject with route params', async () => {
    callCount = 0;
    const ids = [];
    server.route({
      method: 'GET',
      path: '/checkUrlInject/{requestId}',
      handler(request, h) {
        callCount ++;
        ids.push(request.params.requestId);
        return { test: true };
      }
    });
    const response = await server.inject({
      url: '/injectParams/'
    });
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(1000);
    const response2 = await server.inject({
      url: '/injectParams/'
    });
    expect(callCount).to.equal(2);
    expect(ids[0]).to.not.equal(ids[1]);
  });
});
