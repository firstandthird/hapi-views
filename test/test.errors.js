/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');
const Boom = require('boom');

lab.experiment('errors', () => {
  const server = new Hapi.Server({
    debug: { log: 'hapi-views' },
    port: 9991
  });

  lab.before( async () => {
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
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
            },
            '/401': {
              view: 'api',
              api: { var1: 'http://localhost:9991/api/401' }
            }
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
      path: '/api/500',
      handler(request, h) {
        throw new Error('testing');
      }
    });
    server.route({
      method: 'GET',
      path: '/api/404',
      handler(request, h) {
        return h.response({ status: 'not found' }).code(404);
      }
    });
    server.route({
      method: 'GET',
      path: '/api/401',
      handler(request, h) {
        throw Boom.unauthorized('nope bud');
      }
    });
    await server.start();
  });

  lab.test('500 errors bubble back up', async() => {
    const response = await server.inject({ url: '/500' });
    expect(response.statusCode).to.equal(500);
  });

  lab.test('404 errors bubble back up', async() => {
    const response = await server.inject({ url: '/404' });
    expect(response.statusCode).to.equal(404);
  });

  lab.test('boom unauthorized errors bubble back up', async() => {
    const response = await server.inject({ url: '/401' });
    expect(response.statusCode).to.equal(401);
  });
});
