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
  lab.before(async () => {
    // start server
    await server.register([
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
  lab.test('api', async () => {
    const response = await server.inject({ url: '/apitest' });
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
  });

  lab.test('method', async () => {
    const response = await server.inject({ url: '/methodtest' });
    const context = response.request.response.source.context;
    expect(context).to.equal({ yaml: {}, api: {}, method: { var1: 'test' }, inject: {} });
  });

  lab.test('data', async () => {
    const response = await server.inject({ url: '/data' });
    const context = response.request.response.source.context;
    expect(context).to.equal({ name: 'Jack', url: '/data', test: { ok: 'true' } });
  });

  lab.test('methods', async () => {
    const response = await server.inject({ url: '/methodmulti' });
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
  });
  lab.test('data', async () => {
    const response = await server.inject({ url: '/data' });
    const context = response.request.response.source.context;
    expect(context).to.equal({ name: 'Jack', url: '/data', test: { ok: 'true' } });
  });

  lab.test('data as string', async () => {
    const response = await server.inject({ url: '/data-string' });
    const context = response.request.response.source.context;
    expect(context).to.equal({
      yaml1: {
        test1: 'true'
      }
    });
  });

  lab.test('dataMethod call that server method for processing data', async () => {
    server.method('handle.data', function(results) {
      return results.yaml;
    });
    const response = await server.inject({ url: '/data-method' });
    const context = response.request.response.source.context;
    expect(context).to.equal({
      yaml1: {
        test1: 'true'
      }
    });
  });
});

lab.experiment('methods with args', () => {
  let server;

  lab.before(async () => {
    server = new Hapi.Server({
      debug: { log: ['hapi-views', 'error'], request: ['error'] }
    });

    await server.register([
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
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });

    server.method('myScope.myMethod', function(arg1, arg2, arg3) {
      return arg1 + arg2 + arg3;
    });
    server.method('someMethod', function(name) {
      return name;
    });
    server.method('someOtherMethod', function(harbinger, score) {
      return `${harbinger}+${score}`;
    });

    await server.start();

  });

  lab.test('can pass args to a method', async() => {
    const response = await server.inject({
      url: '/methodWithArgs/Jack?score=56',
      method: 'get'
    });
    expect(response.result).to.include('trueJack56');
  });

  lab.test('can pass args to multiple methods', async() => {
    const response = await server.inject({
      url: '/multiMethods/Jack/albatross?score=70',
      method: 'get'
    });
    expect(response.result).to.include('Jack');
    expect(response.result).to.include('albatross+70');
  });
  lab.test('can pass args to multiple methods (obj)', async(done) => {
    const response = await server.inject({
      url: '/multiMethodsObj/Jack/albatross?score=70',
      method: 'get'
    });
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
  });
});

lab.experiment('method with view function', () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  lab.before(async () => {
    // start server
    await server.register([
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
            '/methodfunction': {
              view: (data) => data.method.method1,
              method: { method1: 'testerino' }
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
      // this needs to return the name of the view:
      return 'method';
    });

    server.method('testmethod2', function() {
      return 'test2';
    });

    server.method('myScope.myMethod', function() {
      return 'test3';
    });

    await server.start();
  });

  lab.test('method', async () => {
    const response = await server.inject({ url: '/methodfunction' });
    expect(response.result).to.include('method');
  });
});
