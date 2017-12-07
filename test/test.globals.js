'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
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
        debug: true,
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
              yaml1: "{{methods.yaml(`${process.cwd()}/test/yaml/test1.yaml`)}}",
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
  expect(context.yaml2).to.equal({ property: 1235 });
  await server.stop();
});

lab.test('onError', async() => {
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
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: "{{methods.makeError()}}",
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
  expect(response.result).to.equal('the error was handled');
  await server.stop();
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
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: "{{methods.yaml(`${process.cwd()}/test/yaml/test1.yaml`)}}",
            },
            onError: (err, h) => {
              expect(err).to.not.equal(null);
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
  expect(response.result).to.equal('the error was handled');
  await server.stop();
});

lab.test('preprocess', async() => {
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
              yaml1: "{{methods.yaml(`${process.cwd()}/test/yaml/test1.yaml`)}}",
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

  await server.register([
    require('vision'),
    {
      plugin: require('../'),
      options: {
        routes: {
          '/yaml': {
            view: 'yaml',
            data: {
              yaml1: "{{methods.yaml(`${process.cwd()}/test/yaml/test1.yaml`)}}",
            },
            preResponse: (request, options, h) => { processRan = true; }
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
