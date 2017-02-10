/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');
const EOL = require('os').EOL;

lab.experiment('yaml', () => {
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
});

lab.experiment('api', () => {
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
              api: 'http://jsonplaceholder.typicode.com/posts?id=1'
            },
            '/apivar/{id}': {
              view: 'api',
              api: 'http://jsonplaceholder.typicode.com/posts?id={params.id}'
            },
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
        api: [ { userId: 1,
             id: 1,
             title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
             body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' }
         ]
      });
      done();
    });
  });

  lab.test('api with variables', done => {
    server.inject({
      url: '/apivar/1'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({ yaml: {},
        method: {},
        inject: {},
        api: [ { userId: 1,
             id: 1,
             title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
             body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' }
         ]
      });
      done();
    });
  });
});

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
              api: 'http://jsonplaceholder.typicode.com/posts?id=1'
            },
            '/methodtest': {
              view: 'method',
              method: 'testerino'
            },
            '/methodmulti': {
              view: 'method',
              method: ['testerino', 'testmethod2', 'myScope.myMethod']
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
            },
            '/data-method': {
              view: 'data',
              yaml: 'test1.yaml',
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
        api: [ { userId: 1,
             id: 1,
             title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
             body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' }
         ]
      });
      done();
    });
  });

  lab.test('method', done => {
    server.inject({
      url: '/methodtest'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({ yaml: {}, api: {}, method: 'test', inject: {} });
      done();
    });
  });
  lab.test('data', done => {
    server.inject({
      url: '/data'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({ name: 'Jack', url: '/data', test: { ok: true } });
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
      const context = response.request.response.source.context;
      expect(context).to.equal({ name: 'Jack', url: '/data', test: { ok: true } });
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

  lab.test('dataMethod call that server method for processing data', done => {
    server.method('handle.data', function(results, next) {
      next(null, results.yaml);
    });
    server.inject({
      url: '/data-method'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        test1: 'true'
      });
      done();
    });
  });
});

lab.experiment('injects', () => {
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
            '/apivar/{id}': {
              view: 'api',
              api: 'http://jsonplaceholder.typicode.com/posts?id={params.id}'
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
                name: 'myScope.myMethod',
                args: [true, '{request.params.name}', '{request.query.score}']
              }
              // three args, one static and two derived from the request:
            },
            '/multiMethods/{name}/{harbinger}': {
              view: 'methodWithArgs',
              method: [{
                name: 'someMethod',
                args: ['{request.params.name}']
              }, {
                name: 'someOtherMethod',
                args: ['{request.params.harbinger}', '{request.query.score}']
              }]
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

lab.experiment('errors', () => {
  const server = new Hapi.Server({
    debug: { log: 'hapi-views' }
  });

  server.connection({ port: 9991 });

  lab.before(start => {
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          debug: true,
          views: {
            '/500': {
              view: 'api',
              api: 'http://localhost:9991/api/500'
            },
            '/404': {
              view: 'api',
              api: 'http://localhost:9991/api/404'
            }
          }
        }
      }], (error) => {
        Hoek.assert(!error, error);

        server.views({
          engines: { html: require('handlebars') },
          path: `${__dirname}/views`
        });

        server.route({
          method: 'GET',
          path: '/api/500',
          handler(request, reply) {
            reply(new Error('testing'));
          }
        });

        server.route({
          method: 'GET',
          path: '/api/404',
          handler(request, reply) {
            reply({ status: 'not found' }).code(404);
          }
        });

        server.start((err) => {
          Hoek.assert(!err, err);
          start();
        });
      });
  });

  lab.test('500 errors bubble back up', (done) => {
    server.inject({
      url: '/500'
    }, (response) => {
      expect(response.statusCode).to.equal(500);
      done();
    });
  });

  lab.test('404 errors bubble back up', (done) => {
    server.inject({
      url: '/404'
    }, (response) => {
      expect(response.statusCode).to.equal(404);
      done();
    });
  });
});
lab.experiment('onError', () => {
  lab.test('top-level onError', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('makeError', (next) => {
      return next(new Error('this is an error'));
    });
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          onError: (err, reply) => {
            expect(err).to.not.equal(null);
            return reply('the error was handled');
          },
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: 'makeError'
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
    server.start(() => {
      server.inject({
        url: '/throwError'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal('the error was handled');
        done();
      });
    });
  });
  lab.test('top-level onError as server method', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('makeError', (next) => {
      return next(new Error('this is an error'));
    });
    server.method('fetchError', (err, reply) => {
      expect(err).to.not.equal(null);
      return reply('the error was handled');
    });
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          onError: 'fetchError',
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: 'makeError'
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
    server.start(() => {
      server.inject({
        url: '/throwError'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal('the error was handled');
        done();
      });
    });
  });
  lab.test('per-route onError', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('makeError', (next) => {
      return next(new Error('this is an error'));
    });
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: 'makeError',
              onError: (err, reply) => {
                expect(err).to.not.equal(null);
                return reply('the error was handled');
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
    server.start(() => {
      server.inject({
        url: '/throwError'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal('the error was handled');
        done();
      });
    });
  });
  lab.test('per-route onError as server method', (done) => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' }
    });
    server.connection({ port: 9991 });
    server.method('makeError', (next) => {
      return next(new Error('this is an error'));
    });
    server.method('fetchError', (err, reply) => {
      expect(err).to.not.equal(null);
      return reply('the error was handled');
    });
    server.register([
      require('vision'),
      {
        register: require('../'),
        options: {
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: 'makeError',
              onError: 'fetchError'
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
    server.start(() => {
      server.inject({
        url: '/throwError'
      }, (response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal('the error was handled');
        done();
      });
    });
  });
});
lab.experiment('globals', () => {
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
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/apitest': {
              view: 'api',
            },
            '/apivar/{id}': {
              view: 'api',
              method: ['testerino'],
              api: 'http://jsonplaceholder.typicode.com/posts?id=23',
              yaml: 'test2.yaml'
            },
          },
          globals: {
            yaml: 'test1.yaml',
            method: ['testmethod2'],
            api: 'http://jsonplaceholder.typicode.com/posts?id=1'
          }
        }
      }], error => {
      Hoek.assert(!error, error);
      server.method('testmethod2', function(next) {
        next(null, 'test2');
      });
      server.method('testerino', function(next) {
        next(null, 'test');
      });
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
      start();
    });
  });
  lab.test('global api', done => {
    server.inject({
      url: '/apivar/1'
    }, response => {
      const context = response.request.response.source.context;
      // combines if they are arrays:
      expect(context.method).to.equal({
        testmethod2: 'test2', testerino: 'test'
      });
      expect(context.api).to.equal([
        { userId: 3,
          id: 23,
          title: 'maxime id vitae nihil numquam',
          body: 'veritatis unde neque eligendi\nquae quod architecto quo neque vitae\nest illo sit tempora doloremque fugit quod\net et vel beatae sequi ullam sed tenetur perspiciatis'
        }
      ]);
      expect(context.yaml).to.equal({
        global: 'much global',
        test1: 'true'
      });
      done();
    });
  });
});
