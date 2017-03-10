'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');


let server;
lab.experiment('global routeConfig', () => {
  lab.beforeEach((done) => {
    server = new Hapi.Server();
    server.connection();
    server.register(require('vision'), () => {
      server.views({
        engines: { html: require('handlebars') },
        path: `${__dirname}/views`
      });
      done();
    });
  });
  lab.afterEach((done) => {
    server.stop(done);
  });

  lab.test('global route config merges with local route config', (done) => {
    server.register({
      register: require('../'),
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
    }, (err) => {
      expect(err).to.not.exist();
      server.inject('/', (res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['cache-control']).to.equal('max-age=1, must-revalidate, public');
        done();
      });
    });
  });

  lab.test('not setting global route Config', (done) => {
    server.register({
      register: require('../'),
      options: {
        views: {
          '/': {
            view: 'blank'
          }
        }
      }
    }, (err) => {
      expect(err).to.not.exist();
      server.inject('/', (res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['cache-control']).to.equal('no-cache');
        done();
      });
    });
  });

  lab.test('not setting global route Config', (done) => {
    server.register({
      register: require('../'),
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
    }, (err) => {
      expect(err).to.not.exist();
      server.inject('/', (res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['cache-control']).to.equal('max-age=2, must-revalidate, public');
        done();
      });
    });
  });
});
