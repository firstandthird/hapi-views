/* eslint prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('methods', () => {
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
            '/apitest': {
              view: 'api',
              api: { var1: 'http://jsonplaceholder.typicode.com/posts?id=1' }
            },
            '/methodtest': {
              view: 'method',
              method: { var1: 'testerino' }
            },
            '/methodmulti': {
              view: 'method',
              method: {
                var1: 'testerino',
                var2: 'testmethod2',
                var3: 'myScope.myMethod'
              }
            },
            '/data': {
              view: 'data',
              yaml: { yaml1: 'test1.yaml' },
              data: {
                name: 'Jack',
                url: '{request.url.path}',
                test: {
                  ok: '{yaml.yaml1.test1}'
                }
              }
            },
            '/data-string': {
              view: 'data',
              yaml: { yaml1: 'test1.yaml' },
              data: 'yaml'
            },
            '/data-method': {
              view: 'data',
              yaml: { yaml1: 'test1.yaml' },
              dataMethod: 'handle.data'
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
  lab.test('api', done => {
    server.inject({
      url: '/apitest'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({ yaml: {},
        method: {},
        inject: {},
        api: { var1: [{ userId: 1,
          id: 1,
          title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
          body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' }
        ] }
      });
      done();
    });
  });

  lab.test('method', done => {
    server.inject({
      url: '/methodtest'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({ yaml: {}, api: {}, method: { var1: 'test' }, inject: {} });
      done();
    });
  });
  lab.test('data', done => {
    server.inject({
      url: '/data'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({ name: 'Jack', url: '/data', test: { ok: 'true' } });
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
          var1: 'test',
          var2: 'test2',
          var3: 'test3'
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
      const context = response.request.response.source.context;
      expect(context).to.equal({ name: 'Jack', url: '/data', test: { ok: 'true' } });
      done();
    });
  });

  lab.test('data as string', done => {
    server.inject({
      url: '/data-string'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        yaml1: {
          test1: 'true'
        }
      });
      done();
    });
  });

  lab.test('dataMethod call that server method for processing data', done => {
    server.method('handle.data', function(results, next) {
      next(null, results.yaml);
    });
    server.inject({
      url: '/data-method'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        yaml1: {
          test1: 'true'
        }
      });
      done();
    });
  });
});

lab.experiment('methods with args', () => {
  let server;

  lab.before(start => {
    server = new Hapi.Server({
      debug: { log: ['hapi-views', 'error'], request: ['error'] }
    });

    server.connection();
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
              method: {
                method1: {
                  name: 'myScope.myMethod',
                  args: [true, '{request.params.name}', '{request.query.score}']
                }
              }
              // three args, one static and two derived from the request:
            },
            '/multiMethods/{name}/{harbinger}': {
              view: 'methodWithArgs',
              method: {
                method1: {
                  name: 'someMethod',
                  args: ['{request.params.name}']
                },
                method2: {
                  name: 'someOtherMethod',
                  args: ['{request.params.harbinger}', '{request.query.score}']
                }
              }
            },
            '/multiMethodsObj/{name}/{harbinger}': {
              view: 'method',
              method: {
                someMethod: {
                  name: 'someMethod',
                  args: ['{request.params.name}']
                },
                someOtherMethod: {
                  name: 'someOtherMethod',
                  args: ['{request.params.harbinger}', '{request.query.score}']
                }
              }
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
  lab.test('can pass args to multiple methods (obj)', (done) => {
    server.inject({
      url: '/multiMethodsObj/Jack/albatross?score=70',
      method: 'get'
    }, (response) => {
      expect(response.statusCode).to.equal(200);
      const context = response.request.response.source.context;
      expect(context).to.equal({
        api: {},
        method: {
          someMethod: 'Jack',
          someOtherMethod: 'albatross+70'
        },
        inject: {},
        yaml: { }
      });
      done();
    });
  });
});
