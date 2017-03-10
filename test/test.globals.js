'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

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
          reply({ yaml1: { test: true } });
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
      done();
    });
  });
});
