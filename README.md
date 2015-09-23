# hapi-views

`hapi-views` is a hapi plugin that makes it very easy to register routes for views and pull in data. Great for pages that just need either some static data or data from an api.

## Features

* define routes from config
* pull in yaml data and pass it to the views
* handlebars 4.0 with built in layout support
* (coming soon) pull in data from an api endpoint
* (coming soon) pull in data from a server method

## Usage

```javascript
server.register({
  register: require('hapi-views'),
  options: {
    viewsPath: __dirname + '/public/pages/',
    dataPath: __dirname + '/public/pages/',
    partialsPath: __dirname + '/public/',
    cacheViews: (process.env.NODE_ENV === 'production'),
    views: {
      '/': {
        view: 'landing/view',
        yaml: 'landing/data.yaml'
      }
    }
  }
}, function(err) {
});
```
