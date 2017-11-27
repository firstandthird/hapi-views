'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');
const boom = require('boom');

let server;
lab.experiment('api', async () => {
  lab.before( async () => {
    // start server
    server = new Hapi.Server({
      debug: { request: '*', log: 'hapi-views' },
      port: 9991
    });

    await server.register([
      require('vision'),
      {
        plugin: require('../'),
        options: {
          //debug: true,
          dataPath: `${process.cwd()}/test/yaml`,
          routes: {
            '/apitest': {
              view: 'api',
              data: { key1: "{{methods.api(request, 'http://jsonplaceholder.typicode.com/posts?id=1')}}" }
            },
            '/apitimeout': {
              view: 'api',
              data: { key1: "{{methods.api(request, 'http://localhost:9991/timeout')}}" }
            },
            '/apierror': {
              view: 'api',
              data: { key1: "{{methods.api(request, 'http://localhost:9991/apiError')}}" }
            },
            '/apivar/{id}': {
              view: 'api',
              data: { var1: "{{methods.api(request, 'http://jsonplaceholder.typicode.com/posts?id={params.id}')}}" }
            },
            '/apiHeader/': {
              view: 'api',
              data: {
                var1: "{{methods.api(request, { url: 'http://localhost:9991/checkHeader', headers: { 'x-api-key': '1234' } })}}"
              }
            },
            '/apiHeader2/': {
              view: 'api',
              data: {
                value1: "{{methods.api(request, 'http://jsonplaceholder.typicode.com/posts?id=2')}}",
                value2: "{{methods.api(request, { url: 'http://localhost:9991/checkHeader', headers: { 'x-api-key': '1234' } }) }}"
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

    server.route({
      method: 'GET',
      path: '/timeout',
      handler: async(request, h) => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        await wait(6000);
        return {};
      }
    });
    server.route({
      method: 'GET',
      path: '/checkHeader',
      handler(request, h) {
        expect(request.headers['x-api-key']).to.equal('1234');
        return { test: true };
      }
    });
    server.route({
      method: 'GET',
      path: '/api',
      handler(request, h) {
        expect(request.info.referrer).to.equal('refererWithTwoRs');
        expect(request.headers).to.include('user-agent');
        return { test: true };
      }
    });
    server.route({
      method: 'GET',
      path: '/apiError',
      handler(request, h) {
        throw boom.locked('uh uh no');
      }
    });
    await server.start();
  });

  lab.after(async() => {
    await server.stop();
  });

  // tests
  lab.test('api with headers', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/apiHeader/'
    });
    const context = response.request.response.source.context;
    expect(context.var1.test).to.equal(true);
    const response2 = await server.inject({
      method: 'GET',
      url: '/apiHeader2/'
    });
    const context2 = response2.request.response.source.context;
    expect(context2.value1[0].id).to.equal(2);
    expect(context2.value2.test).to.equal(true);
  });

/*
  lab.test('api', async () => {
    const response = await server.inject({
      url: '/apitest'
    });
    const context = response.request.response.source.context;
    expect(context).to.equal({ yaml: {},
      method: {},
      inject: {},
      api: {
        data: { key1: [{ userId: 1,
          id: 1,
          title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
          body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' }
        ]
      }
    });
  });
  lab.test('api with timeout', { timeout: 10000 }, async () => {
    const response = await server.inject({
      url: '/apitimeout'
    });
    expect(response.statusCode).to.equal(504);
  });

  lab.test('api with variables', async () => {
    const response = await server.inject({
      url: '/apivar/1'
    });
    const context = response.request.response.source.context;
    expect(context).to.equal({ yaml: {},
      method: {},
      inject: {},
      api: {
        var1: [{ userId: 1,
          id: 1,
          title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
          body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' }
        ]
      }
    });
  });
  lab.test('api friendly boom errors', async () => {
    const response = await server.inject({
      url: '/apierror'
    });
    // verify boom status code and friendly error message:
    expect(response.statusCode).to.equal(423);
    expect(response.statusMessage).to.equal('Locked');
    expect(response.payload).to.include('uh uh no');
  });
*/
});
