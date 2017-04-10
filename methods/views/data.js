'use strict';
const varson = require('varson');
const Hoek = require('hoek');

module.exports = (request, data, results, allDone) => {
  if (!data) {
    return allDone(null);
  }
  if (typeof data === 'string') {
    return allDone(null, results[data]);
  }
  const clonedData = Hoek.clone(data);
  const context = Hoek.clone(results);
  context.request = {
    params: request.params,
    query: request.query,
    url: request.url,
    auth: request.auth
  };
  const out = varson(clonedData, context, { start: '{', end: '}' });
  allDone(null, out);
};
