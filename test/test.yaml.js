/* eslint prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('yaml', async() => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  lab.before( async() => {
    // start server
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          //debug: true,
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/yaml': {
              view: 'yaml',
              yaml: { yaml1: 'test1.yaml' }
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

    server.method('testerino', function() {
      return 'test';
    });

    server.method('testmethod2', function() {
      return 'test2';
    });

    server.method('myScope.myMethod', function() {
      return 'test3';
    });

    await server.start();
  });
  // tests
  lab.test('yaml', async () => {
    const response = await server.inject({ url: '/yaml' });
    const context = response.request.response.source.context;
    expect(context).to.equal({
      api: {},
      method: {},
      inject: {},
      yaml: {
        yaml1: { test1: 'true' }
      }
    });
  });
});
