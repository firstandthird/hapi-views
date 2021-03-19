# hapi-views

[![Build Status](https://travis-ci.org/firstandthird/hapi-views.svg?branch=master)](https://travis-ci.org/firstandthird/hapi-views)
[![Coverage Status](https://coveralls.io/repos/github/firstandthird/hapi-views/badge.svg?branch=master)](https://coveralls.io/github/firstandthird/hapi-views?branch=master)

`hapi-views` is a hapi plugin that lets you quickly create view routes. You use JSON (or YAML) to specify routes that can pull in dynamic data from any source, then use that data to render an HTML page.

## Features

* works with any Hapi-compatible view engine
* define view routes with concise JSON config files instead of programming route handlers in filthy Javascript
* specify dynamic JSON for your views with [varson](https://github.com/firstandthird/varson)
* pull in data with Hapi server methods

## Usage

```js
server.method('getUserInfo', async(id) => {
  const user = await fetch(id);
  return user;
});
await server.register({
  plugin: require('hapi-views'),
  options: {
    routes: {
      '/homepage/{userId}': {
        view: 'homepage',
        data: {
          title: "Your Homepage",
          amount: "{{ 15 + 25 }}",
          userInfo: "{{getUserInfo(request.params.userId)}}"
        }
      }
    }
  }
});
```

- For each key in _routes_, hapi-views will register a route handler matching that path.  The route will render the indicated _view_, passing _data_ as the context of the view.
- hapi-views uses the [varson](https://github.com/firstandthird/varson) library to evaluate statements that appear in the double brackets.  Any method defined in _server.methods_ will be available from here and you can refer to the _request_ object in the method parameters, eg: _foo(request.params.userId)_ will work as expected from here.
- passing '?debug=1' to a route will cause the server to log debug info as it renders the route

## Route Options

- __view__ (required)

  The name of the view to render, the view must be available to the render engine you registered with hapi.

- __data__ (required)

  The data to pass to the rendering method

- __groupedData__

  An object containing additional data you can pass to the rendering method

- __preProcess__

  A method that takes in _(request, options, h)_ as parameters and is called after the request is processed, but before the view is returned,
  you can use _preProcess_ to do any preprocessing you need

- __preResponse__

  A method that takes in a function that takes in _(request, options, h)_ as parameters and is called after the view has been rendered, but before it
  is returned to the client

- __onError__

  A method that takes in _(err, h)_ as parameters and is called any time there is an error processing your route.  If _onError_ is defined then
  whatever value it returns will be passed back to the client.


## Top-Level Options

- __globals__

  An object that will be merged with the data field and passed to each render function.

- __allowDebugJson__ (default is false)

  When this is set to true, you can pass '?json=1' to a view route and it will
  return the render data for the route instead of rendering the view

## Example
```javascript
server.method('getUserInfo', async(id) => {
  const user = await db.users.findOne({ _id: id });
  return user;
});

await server.register({
  plugin: require('hapi-views'),
  options: {
    globals: {
      serverName: 'Bob the Server',
      db: 'http://55.55.55.5555:2121/bobDb'
    },
    routes: {
      '/homepage/{userId}': {
        view: 'homepage',
        data: {
          title: "Your Homepage",
          amount: "{{ 15 + 25 }}",
          userInfo: "{{getUserInfo(request.params.userId)}}"
        },
        preProcess: (request, options, h) => {
          request.server.log('Going to render the view');
        },
        preResponse: (request, options, h) => {
          request.server.log('View has been rendered!');
        },
        onError: (err, h) => { return 'There was an error processing your request' }
      }
    }
  }
});
```
