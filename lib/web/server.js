var express = require('express'),
    connect = require('connect'),
    config = require("../../config/config.js"),
    riak = require('riak-js').getClient(config),
    sessionStore = require("../session_store.js"),
    mrFunctions = require("../map_reduce.js");

var app = express.createServer(
  express.static(__dirname + '/public'),
  express.bodyParser(),
  connect.cookieParser(),
  connect.session({
    secret: 'your secret passphrase',
    store: new sessionStore({
      bucket: "syslog-web-sessions",
      client: riak
    })
  })
);

var json = function(object) {
  return JSON.stringify(object);
}

var buildQuery = function(params) {
  var query = params.query;
  if(params.facility !== null && params.facility !== "") {
    query += " facility:" + params.facility;
  }

  var from = params.from, to = params.to;
  if (from !== null && from !== "" && to !== null && to !== "") {
    query += " AND time:[\"" + from +  "\" TO \"" + to + "\"]";
  } else if (from !== null && from !== "" && (to === null || to === "")) {
    query += " AND time:[\"" + from +  "\" TO 99999999999]";
  } else if ((from === null || from === "") && to !== null && to !== "") {
    query += " AND time:[0 TO \"" + to + "\"]";
  }

  return query;
}

app.set('views', __dirname + '/views');

function restrict(req, res, next) {
  if (req.session.logged_in) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

function authenticate(user, password) {
  return user == 'riak' && password == 'awesomesauce';
}

function mapReduce(request, response, next) {
  if (request.body.search.map_reduce == '1') {
    var mr = riak.addSearch('syslog', buildQuery(request.body.search));
    if (request.body.search.map_function !== null && request.body.search.map_function !== "") {
      mr.map(mrFunctions['map'][request.body.search.map_function]);
    }
    if (request.body.search.reduce_function !== null && request.body.search.reduce_function !== "") {
      mr.reduce(mrFunctions['reduce'][request.body.search.reduce_function]);
    }

    mr.run(function(err, data) {
      response.send(json({mapreduce: data}));
    });
  } else {
    next();
  }
}

function contentTypeIsJson(request, response, next) {
  response.contentType('.json');
  next();
}

function search(request, response, next) {
  riak.search('syslog', buildQuery(request.body.search), {"q.op":request.body.search.operator, sort: 'time', rows: 200}, function(err, data) {
    var docs = [];
    if (data) {
      docs = data.docs
    }
    response.send(json({results: docs}));
  });
}

app.get('/', restrict, function(request, response) {
  response.render('index.ejs');
});

app.post('/search', contentTypeIsJson, mapReduce, search);

app.get('/login', function(request, response) {
  if (request.session.logged_in) {
    response.redirect('/');
  } else {
    response.render('login.ejs');
  }
});

app.post('/login', function(request, response) {
  if (authenticate(request.body.user, request.body.password)) {
    request.session.regenerate(function(){
      request.session.logged_in = true;
      response.redirect('/');
    });
  } else {
    response.render('login.ejs');
  }
});

module.exports = app;
