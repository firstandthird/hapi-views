# hapi-views

`hapi-views` is a hapi plugin that makes it very easy to register routes for views and pull in data. Great for pages that just need either some static data or data from an api.

## Features

* define routes from config
* pull in yaml data and pass it to the views
* pull in data from an api endpoint
* pull in data from a server method

## Usage

```javascript
server.register({
  register: require('hapi-views'),
  options: {
    dataPath: __dirname + '/public/pages/',
    views: {
      '/': {
        view: 'landing/view',
        yaml: 'landing/data.yaml'
      },
      '/comments': {
        view: 'landing/view',
        api: 'http://jsonplaceholder.typicode.com/comments/1'
      },
      '/load': {
        view: 'landing/view',
        method: 'serverLoad'
      }
    }
  }
}, function(err) {
});
```
