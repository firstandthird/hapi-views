'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('api', () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.connection({ port: 9991 });
  lab.before(start => {
    // start server
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          //debug: true,
          enableCache: true,
          cache: {
            expiresIn: 60000,
            generateTimeout: 100
          },
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/apitest': {
              view: 'api',
              api: { key1: 'http://localhost:9991/testRoute', key2: { url: 'http://localhost:9991/testRoute2' } }
            },
            '/methodtest': {
              view: 'api',
              method: { var1: 'testerino', var2: { name: 'testerino', args: [true, 1, 'fifteen'] } }
            },
            '/methodArgstest': {
              view: 'api',
              method: { var1: { name: 'testerino', args: [false, 3, 'twelve'] } }
            },
            '/injecttest': {
              view: 'api',
              inject: { var1: '/injectRoute' },
            }
          }
        }
      }], error => {
      Hoek.assert(!error, error);

      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });

      server.start((err) => {
        Hoek.assert(!err, err);
        start();
      });
    });
  });
  lab.after(end => {
    server.stop(end);
  });

  lab.test('api', done => {
    let callCount = 0;
    server.route({
      method: 'GET',
      path: '/testRoute',
      handler(request, reply) {
        callCount ++;
        reply({ test: true });
      }
    });
    server.route({
      method: 'GET',
      path: '/testRoute2',
      handler(request, reply) {
        reply({ test2: '1' });
      }
    });
    server.inject({
      url: '/apitest'
    }, response => {
      const context = response.request.response.source.context;
      expect(context.api.key1).to.equal({ test: true });
      server.inject({
        url: '/apitest'
      }, response2 => {
        const context2 = response.request.response.source.context;
        expect(context2.api.key1).to.equal({ test: true });
        expect(context2.api.key2).to.equal({ test2: '1' });
        expect(callCount).to.equal(1);
        done();
      });
    });
  });

  lab.test('inject', done => {
    let callCount = 0;
    server.route({
      method: 'GET',
      path: '/injectRoute',
      handler(request, reply) {
        callCount ++;
        reply({ test: true });
      }
    });
    server.inject({
      method: 'GET',
      url: '/injecttest'
    }, response => {
      const context = response.request.response.source.context;
      expect(context.inject.var1).to.equal({ test: true });
      server.inject({
        url: '/injecttest'
      }, response2 => {
        const context2 = response.request.response.source.context;
        expect(context2.inject.var1).to.equal({ test: true });
        expect(callCount).to.equal(1);
        done();
      });
    });
  });

  lab.test('method', done => {
    let callCount = 0;
    server.method('testerino', (arg1, arg2, arg3, next) => {
      callCount ++;
      if (typeof arg1 === 'function') {
        next = arg1;
      }
      next(null, 'test');
    });
    server.inject({
      url: '/methodtest'
    }, response => {
      const context = response.request.response.source.context;
      expect(context.method.var1).to.equal('test');
      expect(callCount).to.equal(2);
      server.inject({
        url: '/methodtest'
      }, response2 => {
        const context2 = response.request.response.source.context;
        expect(context2.method.var1).to.equal('test');
        expect(callCount).to.equal(2);
        server.inject({
          url: '/methodArgstest'
        }, (response3) => {
          // same method but different args should still call:
          expect(callCount).to.equal(3);
          done();
        });
      });
    });
  });
});
