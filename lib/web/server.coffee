express = require "express"
connect = require "connect"
config = require "../../config/config.js"
riak = require("riak-js").getClient(config)
sessionStore = require "../session_store.js"
mrFunctions = require "../map_reduce.js"

app = express.createServer(
  express.static(__dirname + '/public'),
  express.bodyParser(),
  connect.cookieParser(),
  connect.session(
    secret: "aos;fop;qe13hpoaneruhwphfepaf",
    store: new sessionStore(bucket: "syslog-web-sessions", client: riak)
  )
)

app.set 'views', __dirname + '/views'

json = (object) ->
  JSON.stringify(object)

buildQuery = (params) ->
  query = params["query"]
  if params["facility"]
    query += " AND facility: #{params["facility"]}"

  [from, to] = [params["from"], params["to"]]

  if from and to
    query += " AND time:[#{from} TO #{to}]"
  else if from and not to
    query += " AND time:[#{from} TO 99999999999]"
  else if not from and to
    query += " AND time:[0 TO #{to}]"

  query

restrict = (request, response, next) ->
  if (request.session.logged_in)
    next()
  else
    request.session.error = "Access denied!"
    response.redirect "/login"

authenticate = (user, password) ->
  user == "riak" and password == "awesomesauce"

mapReduce = (request, response, next) ->
  if request.body.search.map_reduce is "1"
    mapreduce = riak.addSearch "syslog", buildQuery(request.body.search)
    if request.body.search.map_function
      mapreduce.map(mrFunctions["map"][request.body.search.map_function])

    if request.body.search.reduce_function
      reduceFunctions = request.body.search.reduce_function
      (mr.reduce(mrFunctions["reduce"][reduce]) for reduce in reduceFunctions when reduce isnt null)

    mapreduce.run (error, data) ->
      response.send(json(mapreduce: data))
  else
    next()

contentTypeIsJson = (request, response, next) ->
  response.contentType ".json"
  next()

search = (request, response, next) ->
  riak.search 'syslog', buildQuery(request.body.search), {sort: 'time', rows: 200}, (error, data) ->
    docs = []
    if data
      docs = data.docs

    response.send(json(results: docs))

app.get "/", restrict, (request, response) ->
  response.render "index.ejs"

app.post "/search", contentTypeIsJson, mapReduce, search

app.get "/login", (request, response) ->
  if authenticate(request.body.user, request.body.password)
    request.session.regenerate () ->
      request.session.logged_in = true
      response.redirect "/"
  else
    response.header "login.ejs"

module.exports = app
