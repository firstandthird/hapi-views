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
          dataPath: `${process.cwd()}/test/yaml`,
          views: {
            '/apitest': {
              view: 'api',
              api: { key1: 'http://jsonplaceholder.typicode.com/posts?id=1' }
            },
            '/apivar/{id}': {
              view: 'api',
              api: { var1: 'http://jsonplaceholder.typicode.com/posts?id={params.id}' }
            },
            '/apiHeader/': {
              view: 'api',
              api: {
                var1: {
                  url: 'http://localhost:9991/checkHeader',
                  headers: {
                    'x-api-key': '1234'
                  }
                }
              }
            },
            '/apiHeader2/': {
              view: 'api',
              api: {
                value1: 'http://jsonplaceholder.typicode.com/posts?id=2',
                value2: {
                  url: 'http://localhost:9991/checkHeader',
                  headers: {
                    'x-api-key': '1234'
                  }
                }
              }
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
        path: '/checkHeader',
        handler(request, reply) {
          expect(request.headers['x-api-key']).to.equal('1234');
          return reply({ test: true });
        }
      });

      server.route({
        method: 'GET',
        path: '/api',
        handler(request, reply) {
          expect(request.info.referrer).to.equal('refererWithTwoRs');
          expect(request.headers).to.include('user-agent');
          reply({ test: true });
        }
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
  // tests
  lab.test('api with headers', done => {
    server.inject({
      method: 'GET',
      url: '/apiHeader/'
    }, response => {
      const context = response.request.response.source.context;
      expect(context.api.var1.test).to.equal(true);
      server.inject({
        method: 'GET',
        url: '/apiHeader2/'
      }, response2 => {
        const context2 = response2.request.response.source.context;
        expect(context2.api.value1[0].id).to.equal(2);
        expect(context2.api.value2.test).to.equal(true);
        done();
      });
    });
  });
  lab.test('api', done => {
    server.inject({
      url: '/apitest'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({ yaml: {},
        method: {},
        inject: {},
        api: {
          key1: [{ userId: 1,
            id: 1,
            title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
            body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' }
          ]
        }
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
        api: {
          var1: [{ userId: 1,
            id: 1,
            title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
            body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto' }
          ]
        }
      });
      done();
    });
  });
});
