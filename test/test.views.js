const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');

const wait = (timeout) => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

lab.test('server methods', async() => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.method('yaml', (param1, param2) => {
    return new Promise((resolve) => {
      expect(param1).to.equal(1234);
      expect(param2).to.equal('5678');
      return resolve({ test1: true });
    });
  });
  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        debug: true,
        dataPath: `${process.cwd()}/test/yaml`,
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: "yaml(1234, '5678')",
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
  await server.stop();
});

lab.test('server methods with request params', async() => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.method('test', (param1, param2) => {
    return new Promise((resolve) => {
      expect(param1).to.equal('hello');
      expect(param2).to.equal('5678');
      return resolve({ test1: true });
    });
  });
  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        debug: true,
        routes: {
          '/{slug}': {
            view: 'yaml',
            data: {
              method: 'test(request.params.slug, "5678")',
              string: 'string',
              number: 123
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
  const response = await server.inject({ url: '/hello' });
  const context = response.request.response.source.context;
  expect(context).to.equal({
    method: { test1: true },
    string: 'string',
    number: 123
  });
  await server.stop();
});

lab.test('globals', async() => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.method('yaml', (request, yamlFile) => {
    return new Promise((resolve) => {
      return resolve({ test1: true });
    });
  });
  // start server
  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        dataPath: `${process.cwd()}/test/yaml`,
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: 'yaml()',
            }
          }
        },
        globals: {
          yaml2: { property: 1235 }
        }
      }
    }
  ]);
  server.views({
    engines: { html: require('handlebars') },
    path: `${__dirname}/views`
  });
  const response = await server.inject({ url: '/yaml' });
  const context = response.request.response.source.context;
  expect(context).to.equal({
    yaml1: { test1: true },
    yaml2: { property: 1235 }
  });
  await server.stop();
});

lab.test('grouped', async() => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.method('yaml', (request, yamlFile) => {
    return new Promise((resolve) => {
      return resolve({ test1: true });
    });
  });
  server.method('yaml2', (request, yamlFile) => {
    return new Promise((resolve) => {
      return resolve({ yaml2: { property: 1235 } });
    });
  });
  // start server
  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        dataPath: `${process.cwd()}/test/yaml`,
        routes: {
          '/yaml': {
            view: 'yaml',
            groupedData: {
              grouped: true
            },
            data: {
              yaml1: 'yaml()',
            }
          }
        },
        globals: 'yaml2()'
      }
    }
  ]);
  server.views({
    engines: { html: require('handlebars') },
    path: `${__dirname}/views`
  });
  const response = await server.inject({ url: '/yaml' });
  const context = response.request.response.source.context;
  expect(context).to.equal({
    yaml1: { test1: true },
    yaml2: { property: 1235 },
    grouped: true
  });
  await server.stop();
});

lab.test('onError', async() => {
  const server = new Hapi.Server({
    debug: { log: 'hapi-views', request: '*' },
    port: 9991
  });
  server.method('makeError', () => { throw new Error('this is an error'); });
  let theError = null;
  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        onError: (err, h) => {
          theError = err;
          return 'the error was handled';
        },
        debug: true,
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: 'makeError()',
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
  const response = await server.inject({ url: '/yaml' });
  expect(response.statusCode).to.equal(200);
  expect(theError).to.not.equal(null);
  expect(theError.toString()).to.equal('Error: this is an error');
  await server.stop();
});

lab.test('per-route onError', async() => {
  const server = new Hapi.Server({
    debug: { log: 'hapi-views' },
    port: 9991
  });
  let theError;
  server.method('makeError', () => { throw new Error('this is an error'); });
  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        // debug: true,
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: 'makeError()',
            },
            onError: (err, h) => {
              theError = err;
              return 'the error was handled';
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
  const response = await server.inject({ url: '/yaml' });
  expect(response.statusCode).to.equal(200);
  expect(theError).to.not.equal(undefined);
  expect(theError.toString()).to.equal('Error: this is an error');
  await server.stop();
});

lab.test('preprocess', async() => {
  let processRan = false;
  const server = new Hapi.Server({
    debug: { log: 'hapi-views', request: '*' },
    port: 9991
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
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: "yaml()",
            },
            preProcess: (request, options, h) => { processRan = true; }
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
  const response = await server.inject({ url: '/yaml' });
  expect(response.statusCode).to.equal(200);
  expect(processRan).to.equal(true);
  await server.stop();
});

lab.test('preprocess with redirect', async() => {
  const server = new Hapi.Server({
    debug: { log: 'hapi-views', request: '*' },
    port: 9991
  });
  server.method('doData', (request, opts) => {
    return { something: 'for nothing' };
  });

  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        routes: {
          '/not-here': {
            view: 'yaml',
            data: {
              yaml1: "doData()",
            },
            preProcess: (request, opts, h) => {
              return h.redirect('/forward');
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
  const response = await server.inject({ url: '/not-here' });
  expect(response.statusCode).to.equal(302);
  await server.stop();
});

lab.test('preResponse', async() => {
  let processRan = false;
  const server = new Hapi.Server({
    debug: { log: 'hapi-views' },
    port: 9991
  });
  server.method('yaml', (request, yamlFile) => {
    return new Promise((resolve) => {
      return resolve({ test1: true });
    });
  });
  let passedData;
  let passedH;
  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: 'yaml()',
            },
            preResponse: (request, options, data, h) => {
              passedData = data;
              passedH = h;
              processRan = true;
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
  const response = await server.inject({ url: '/yaml' });
  expect(passedData.yaml1.test1).to.equal(true);
  expect(typeof passedH.response).to.equal('function');
  expect(response.statusCode).to.equal(200);
  expect(processRan).to.equal(true);
  await server.stop();
});

lab.test('?json=1 will return the JSON content', async () => {
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
        debug: true,
        dataPath: `${process.cwd()}/test/yaml`,
        varsonSettings: {
          start: '{{',
          end: '}}'
        },
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: 'yaml()',
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
  const response = await server.inject({ url: '/yaml?json=1' });
  expect(response.headers['content-type']).to.contain('application/json');
  expect(typeof response.result).to.equal('object');
  expect(response.result).to.equal({ yaml1: { test1: true } });
  await server.stop();
});

lab.test('?debug=1 will log debug info', async () => {
  const server = new Hapi.Server({});
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
        debug: true,
        dataPath: `${process.cwd()}/test/yaml`,
        varsonSettings: {
          start: '{{',
          end: '}}'
        },
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: 'yaml()',
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

  let logged = 0;
  server.events.on('log', (tags, msg) => {
    logged++;
  });

  await server.start();
  // tests
  const response = await server.inject({ url: '/yaml?debug=1' });
  expect(response.statusCode).to.equal(200);
  expect(logged).to.equal(3);
  await server.stop();
});

lab.test('returns stale data on cache error', async () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });

  let requestCount = 0;

  server.method('getData', (request, argg) => {
    requestCount++;
    if (requestCount === 1) {
      return { something: 'sure' };
    }
    throw new Error();
  }, {
    cache: {
      expiresIn: 60000,
      staleIn: 20,
      staleTimeout: 5,
      dropOnError: false,
      generateTimeout: 100
    }
  });

  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        debug: true,
        dataPath: `${process.cwd()}/test/yaml`,
        varsonSettings: {
          start: '{{',
          end: '}}'
        },
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: 'getData()',
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
  expect(response.statusCode).to.equal(200);

  const context = response.request.response.source.context;
  expect(context).to.equal({ yaml1: { something: 'sure' } });

  await wait(21);

  const resp2 = await server.inject({ url: '/yaml' });
  expect(resp2.statusCode).to.equal(200);

  const context2 = resp2.request.response.source.context;
  expect(context2).to.equal({ yaml1: { something: 'sure' } }); // stale

  await wait(3);

  const resp3 = await server.inject({ url: '/yaml' });
  expect(resp3.statusCode).to.equal(200);

  const context3 = resp3.request.response.source.context;
  expect(context3).to.equal({ yaml1: { something: 'sure' } }); // stale (non dropped)


  await server.stop();
});

lab.test('preResponse can take over a response ', async() => {
  let processRan = false;
  const server = new Hapi.Server({
    debug: { log: 'hapi-views' },
    port: 9991
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
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: 'yaml()',
            },
            preResponse: (request, options, data, h) => h.response().redirect('/newLocation')
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
  const response = await server.inject({ url: '/yaml' });
  expect(response.statusCode).to.equal(302);
  await server.stop();
});
