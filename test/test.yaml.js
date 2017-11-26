/* eslint prefer-arrow-callback: 0 */
'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');

lab.experiment('yaml', async() => {
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
  });
  // tests
  lab.test('yaml', async () => {
    const response = await server.inject({ url: '/yaml' });
    const context = response.request.response.source.context;
    expect(context).to.equal({ yaml1: { test1: true } });
  });
});
