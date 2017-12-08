# hapi-views

[![Build Status](https://travis-ci.org/firstandthird/hapi-views.svg?branch=master)](https://travis-ci.org/firstandthird/hapi-views)
[![Coverage Status](https://coveralls.io/repos/github/firstandthird/hapi-views/badge.svg?branch=master)](https://coveralls.io/github/firstandthird/hapi-views?branch=master)

`hapi-views` is a hapi plugin that lets you quickly and easily create your view routes. You use JSON to specify routes that can pull in dynamic data from any source, then use that data to render an HTML page.  
## Features

* works with any Hapi view engine
* define view routes with JSON instead of programming route handlers
* specify dynamic JSON for your views with [varson](https://github.com/firstandthird/varson)
* pull in data with Hapi server methods

## Usage

```javascript
await server.register({
  plugin: require('hapi-views'),
  options: {
    // 'globals' (optional) specifies global data that is common to all views
    // data.serverName and data.db will be available to the view engine:
    globals: {
      serverName: 'Bob the Server',
      db: 'http://55.55.55.5555:2121/bobDb'
    }
    // "routes" can contain as many view routes as you like
    // the key is the URL and the value is an object that specifies how to process the view for that URL
    routes: {
      // the URL for this route will be 'http://yourhost.com/homepage/{userId}'
      '/homepage/{userId}': {
        // 'view' (required) tells the view engine what HTML template to use:
        view: 'homepage',
        // 'data' (required) tells the view engine what context data to use when rendering the HTML
        // this data is itself processed by the template engine in varson:
        data: {
          // an example of a literal string value:
          title: "Your Homepage",
          // varson evaluates string values inside the double-bracket '{{' delimiters as Javascript.
          // So the view engine will see data.amount as 35:
          amount: "{{ 15 + 25 }}",
          // the Hapi request object (https://hapijs.com/api#request) can be referenced directly:
          userId: "{{request.params.userId}}",
          // Hapi server methods (https://hapijs.com/api#server.method()) can be referenced as 'methods'.
          // for example, this expression will set data.userInfo to the value returned by calling server.methods.getUserInfo. Works for methods that return a promise as well:
          userInfo: "{{methods.getUserInfo(request.params.userId)}}"
        },
        // 'preProcess' (optional) will be called before the request is processed:
        preProcess: (request, options, h) => {  }
        // 'preResponse (optional) will be called after the request is processed but before the view is returned:
        preResponse: (request, options, h) => { processRan = true; }
        // 'onError' (optional) will be called if there is an error processing your data or view.
        // The value returned by onError will be the result your route returns to the client:
        onError: (err, h) => { return boom.badImplementation('this was an error') }
      }
    }
  }
});
```

  See [test/test.global.js](https://github.com/firstandthird/hapi-views/blob/master/test/test.globals.js) for working examples.
