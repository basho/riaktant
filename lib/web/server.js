var express = require('express');
var config = require("../../config/riak.js");
var riak = require('riak-js').getClient(config);

var app = express.createServer();

app.use(express.bodyDecoder());
app.set('views', __dirname + '/views');

app.get('/', function(request, response) {
  response.render('index.ejs', {locals: {hello: 'world'}});
});

app.post('/search', function(request, response) {
  riak.search('syslog', request.body.search.query, {sort: 'time', rows: 200}, function(err, data) {
    response.contentType('.json');
    var docs = [];
    if (data) {
      docs = data.docs
    }
    response.send(JSON.stringify({results: docs}));
  });
});

app.listen(3000);
