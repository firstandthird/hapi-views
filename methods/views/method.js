'use strict';
const varson = require('varson');
const Hoek = require('hoek');

module.exports = (request, method, allDone) => {
  const methodName = typeof method === 'string' ? method : method.name;
  const reached = Hoek.reach(request.server.methods, methodName);
  if (!reached) {
    request.server.log(['error', 'hapi-views'], { error: 'Method not found', method });
    return allDone(new Error('Method not found'));
  }
  if (method.args) {
    const context = {
      request: {
        params: request.params,
        query: request.query,
        url: request.url,
        auth: request.auth
      }
    };
    const args = varson({ args: Hoek.clone(method.args) }, context, { start: '{', end: '}' }).args;
    args.push(allDone);
    reached.apply(request.server, args);
  } else {
    reached(allDone);
  }
};
