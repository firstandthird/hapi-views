'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');


let server;
lab.experiment('global routeConfig', async() => {
  lab.beforeEach(async() => {
    server = new Hapi.Server();
    await server.register(require('vision'));
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
  });
  lab.afterEach(async() => {
    await server.stop();
  });

  lab.test('global route config merges with local route config', async() => {
    await server.register({
      plugin: require('../'),
      options: {
        routeConfig: {
          cache: {
            privacy: 'public',
            expiresIn: 1000
          }
        },
        views: {
          '/': {
            view: 'blank'
          }
        }
      }
    });
    const res = await server.inject('/');
    expect(res.statusCode).to.equal(200);
    expect(res.headers['cache-control']).to.equal('max-age=1, must-revalidate, public');
  });

  lab.test('not setting global route Config', async() => {
    await server.register({
      plugin: require('../'),
      options: {
        views: {
          '/': {
            view: 'blank'
          }
        }
      }
    });
    const res = await server.inject('/');
    expect(res.statusCode).to.equal(200);
    expect(res.headers['cache-control']).to.equal('no-cache');
  });

  lab.test('not setting global route Config', async() => {
    await server.register({
      plugin: require('../'),
      options: {
        routeConfig: {
          cache: {
            privacy: 'public',
            expiresIn: 1000
          }
        },
        views: {
          '/': {
            view: 'blank',
            routeConfig: {
              cache: {
                expiresIn: 2000
              }
            }
          }
        }
      }
    });
    const res = await server.inject('/');
    expect(res.statusCode).to.equal(200);
    expect(res.headers['cache-control']).to.equal('max-age=2, must-revalidate, public');
  });
});
