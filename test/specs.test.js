/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');
const EOL = require('os').EOL;

lab.experiment('specs', () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.connection();
  lab.before(start => {
    // start server
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          //debug: true,
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/yaml': {
              view: 'yaml',
              yaml: 'test1.yaml'
            },
            '/apitest': {
              view: 'api',
              api: 'http://jsonplaceholder.typicode.com/posts?id=1'
            },
            '/apivar/{id}': {
              view: 'api',
              api: 'http://jsonplaceholder.typicode.com/posts?id={params.id}'
            },
            '/methodtest': {
              view: 'method',
              method: 'testerino'
            },
            '/methodmulti': {
              view: 'method',
              method: ['testerino', 'testmethod2', 'myScope.myMethod']
            },
            '/inject': {
              inject: '/api',
              view: 'data'
            },
            '/injectmap': {
              inject: {
                api: '/api',
                apivar: '/apivar/1'
              },
              view: 'data'
            },
            '/data': {
              view: 'data',
              yaml: 'test1.yaml',
              data: {
                name: 'Jack',
                url: '{request.url.path}',
                test: {
                  ok: '{yaml.test1}'
                }
              }
            },
            '/data-string': {
              view: 'data',
              yaml: 'test1.yaml',
              data: 'yaml'
            }
          }
        }
      }], error => {
      Hoek.assert(!error, error);

      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });

      server.route({
        method: 'GET',
        path: '/api',
        handler(request, reply) {
          reply({ test: true });
        }
      });

      server.method('testerino', function(next) {
        next(null, 'test');
      });

      server.method('testmethod2', function(next) {
        next(null, 'test2');
      });

      server.method('myScope.myMethod', function(next) {
        next(null, 'test3');
      });

      server.start((err) => {
        Hoek.assert(!err, err);
        start();
      });
    });
  });
  // tests
  lab.test('yaml', done => {
    server.inject({
      url: '/yaml'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        api: {},
        method: {},
        inject: {},
        yaml: {
          test1: 'true'
        }
      });
      done();
    });
  });

  lab.test('api', done => {
    server.inject({
      url: '/apitest'
    }, response => {
      Hoek.assert(response.result.indexOf('1') !== -1, 'Expected output not found');
      done();
    });
  });

  lab.test('api with variables', done => {
    server.inject({
      url: '/apivar/1'
    }, response => {
      Hoek.assert(response.result.indexOf('1') !== -1, 'Expected output not found');
      done();
    });
  });

  lab.test('method', done => {
    server.inject({
      url: '/methodtest'
    }, response => {
      Hoek.assert(response.result.indexOf('test') !== -1, 'Expected output not found');
      done();
    });
  });
  lab.test('data', done => {
    server.inject({
      url: '/data'
    }, response => {
      Hoek.assert(response.result.indexOf('Jack') !== -1, 'Expected output not found');
      Hoek.assert(response.result.indexOf('/data') !== -1, 'Expected output not found');
      Hoek.assert(response.result.indexOf('true') !== -1, 'Expected output not found');
      done();
    });
  });

  lab.test('methods', done => {
    server.inject({
      url: '/methodmulti'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        yaml: {},
        api: {},
        method: {
          testerino: 'test',
          testmethod2: 'test2',
          'myScope.myMethod': 'test3'
        },
        inject: {}
      });
      done();
    });
  });
  lab.test('data', done => {
    server.inject({
      url: '/data'
    }, response => {
      Hoek.assert(response.result.indexOf('Jack') !== -1, 'Expected output not found');
      Hoek.assert(response.result.indexOf('/data') !== -1, 'Expected output not found');
      Hoek.assert(response.result.indexOf('true') !== -1, 'Expected output not found');
      done();
    });
  });

  lab.test('data as string', done => {
    server.inject({
      url: '/data-string'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        test1: 'true'
      });
      done();
    });
  });

  lab.test('inject', done => {
    server.inject({
      url: '/inject'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        yaml: {},
        api: {},
        method: {},
        inject: { test: true }
      });
      done();
    });
  });

  lab.test('injectmap', done => {
    server.inject({
      url: '/injectmap'
    }, response => {
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
      done();
    });
  });

  lab.test('?json=1', done => {
    server.inject({
      url: '/injectmap?json=1'
    }, response => {
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
      done();
    });
  });
});

lab.experiment('methods with args', () => {
  const server = new Hapi.Server({
    debug: { log: 'hapi-views' }
  });

  server.connection();

  lab.before(start => {
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          //debug: true,
          data: `${process.cwd()}/test/yaml`,
          views: {
            '/methodWithArgs/{name}': {
              view: 'method',
              method: 'myScope.myMethod',
              // three args, one static and two derived from the request:
              args: [true, '{request.params.name}', '{request.query.score}']
            },
            '/multiMethods/{name}/{harbinger}': {
              view: 'methodWithArgs',
              method: [{
                method: 'someMethod',
                args: ['{request.params.name}']
              }, {
                method: 'someOtherMethod',
                args: ['{request.params.harbinger}', '{request.query.score}']
              }]
            }
          }
        }
      }], error => {
      Hoek.assert(!error, error);

      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });

      server.method('myScope.myMethod', function(arg1, arg2, arg3, next) {
        next(null, arg1 + arg2 + arg3);
      });
      server.method('someMethod', function(name, next) {
        next(null, name);
      });
      server.method('someOtherMethod', function(harbinger, score, next) {
        next(null, `${harbinger}+${score}`);
      });

      server.start((err) => {
        Hoek.assert(!err, err);
        start();
      });
    });
  });

  lab.test('can pass args to a method', (done) => {
    server.inject({
      url: '/methodWithArgs/Jack?score=56',
      method: 'get'
    }, (response) => {
      expect(response.result).to.include('trueJack56');
      done();
    });
  });

  lab.test('can pass args to multiple methods', (done) => {
    server.inject({
      url: '/multiMethods/Jack/albatross?score=70',
      method: 'get'
    }, (response) => {
      expect(response.result).to.include('Jack');
      expect(response.result).to.include('albatross+70');
      done();
    });
  });
});
