'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.test('server methods', async() => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.method('yaml', (request, yamlFile) => {
    return new Promise((resolve) => {
      return resolve({ test1: true });
    });
  });
  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        //debug: true,
        dataPath: `${process.cwd()}/test/yaml`,
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: "{{methods.yaml(`${process.cwd()}/test/yaml/test1.yaml`)}}",
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
  await server.start();
  // tests
  const response = await server.inject({ url: '/yaml' });
  const context = response.request.response.source.context;
  expect(context).to.equal({ yaml1: { test1: true } });
});
/*
lab.experiment('globals', () => {
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
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/apitest': {
              view: 'api',
            },
            '/apivar/{id}': {
              view: 'api',
              method: { method2: 'testerino' },
              api: { var1: 'http://jsonplaceholder.typicode.com/posts?id=23' },
              yaml: { yaml1: 'test2.yaml' }
            },
          },
          globals: {
            yaml: { yaml1: 'test1.yaml' },
            method: { method1: 'testmethod2' },
            api: { var1: 'http://jsonplaceholder.typicode.com/posts?id=1' }
          }
        }
      }
    ]);
    server.method('testmethod2', function() {
      return 'test2';
    });
    server.method('testerino', function() {
      return 'test';
    });
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    server.route({
      method: 'GET',
      path: '/api',
      handler(request, h) {
        return { yaml1: { test: true } };
      }
    });
  });
  lab.test('global api', async () => {
    const response = await server.inject({ url: '/apivar/1' });
    const context = response.request.response.source.context;
    // combines if they are arrays:
    expect(context.method).to.equal({
      method1: 'test2', method2: 'test'
    });
    expect(context.api).to.equal({ var1: [
      { userId: 3,
        id: 23,
        title: 'maxime id vitae nihil numquam',
        body: 'veritatis unde neque eligendi\nquae quod architecto quo neque vitae\nest illo sit tempora doloremque fugit quod\net et vel beatae sequi ullam sed tenetur perspiciatis'
      }
    ] });
    expect(context.yaml).to.equal({
      yaml1: {
        global: 'much global',
        test1: 'true'
      }
    });
  });
});

lab.experiment('onError', () => {
  lab.test('top-level onError', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('makeError', () => { throw new Error('this is an error'); });
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          onError: (err, h) => {
            expect(err).to.not.equal(null);
            return 'the error was handled';
          },
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: {
                error: 'makeError'
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
    await server.start();
    const response = await server.inject({ url: '/throwError' });
    expect(response.statusCode).to.equal(200);
    expect(response.result).to.equal('the error was handled');
  });

  lab.test('top-level onError as server method', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('makeError', (next) => next(new Error('this is an error')));
    server.method('fetchError', (err, h) => {
      expect(err).to.not.equal(null);
      return 'the error was handled';
    });
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          onError: 'fetchError',
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: {
                makeError: 'makeError'
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
    await server.start();
    const response = await server.inject({ url: '/throwError' });
    expect(response.statusCode).to.equal(200);
    expect(response.result).to.equal('the error was handled');
  });
  lab.test('per-route onError', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('makeError', () => { throw new Error('this is an error'); });
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          // debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: {
                error: 'makeError',
              },
              onError: (err, reply) => {
                expect(err).to.not.equal(null);
                return reply('the error was handled');
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
    await server.start();
    const response = await server.inject({ url: '/throwError' });
    expect(response.statusCode).to.equal(200);
    expect(response.result).to.equal('the error was handled');
  });
  lab.test('per-route onError as server method', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('makeError', () => { throw new Error('this is an error') });
    server.method('fetchError', (err, h) => {
      expect(err).to.not.equal(null);
      return 'the error was handled';
    });
    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          debug: true,
          views: {
            '/throwError': {
              view: 'api',
              method: {
                error: 'makeError',
              },
              onError: 'fetchError'
            }
          }
        }
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
    const response = await server.inject({ url: '/throwError' });
    expect(response.statusCode).to.equal(200);
    expect(response.result).to.equal('the error was handled');
  });

});

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

lab.experiment('pre', () => {
  lab.test('preProcess', async() => {
    let processRan = false;

    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('process', (request, options, reply) => {
      processRan = true;
    });

    server.method('dummy', () => '1');

    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          routes: {
            '/process': {
              view: 'api',
              preProcess: 'process'
            }
          }
        }
      }
    ]);
    server.views({
      engines: { html: require('handlebars') },
      path: `${__dirname}/views`
    });
    await server.start();
    const response = await server.inject({ url: '/process' });
    expect(response.statusCode).to.equal(200);
    expect(processRan).to.equal(true);
  });
  lab.test('preProcess early reply', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('process', (request, options, reply) => {
      return { test: 2 };
    });

    server.method('dummy', () => '1');

    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          routes: {
            '/process': {
              view: 'api',
              preProcess: 'process',
              method: {
                dummy: 'dummy'
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
    await server.start();
    const response = await server.inject({ url: '/process' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.test).to.equal(2);
  });
  lab.test('preResponse', async() => {
    const server = new Hapi.Server({
      debug: { log: 'hapi-views' },
      port: 9991
    });
    server.method('response', (request, options, data) => {
      return { test: 1 };
    });

    server.method('dummy', () => '1');

    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          routes: {
            '/response': {
              view: 'api',
              preResponse: 'response',
              method: {
                dummy: 'dummy'
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
    await server.start();
    const response = await server.inject({ url: '/response' });
    expect(response.statusCode).to.equal(200);
    expect(response.result.test).to.equal(1);
  });
});

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
*/
