// Require needed libraries and config
var config = require("../config/riak.js"),
    syslogParser = require('glossy').Parse,
    dgram = require('dgram'),
    riak = require('riak-js'),
    crypto = require('crypto')

// Create a Riak client that uses the Protocol Buffers interface
var db = riak.getClient({host: config.host,
                         port: config.pbPort,
                         api: 'protobuf'})

// Create the UDP syslog server
var server = dgram.createSocket("udp4")

server.on("message", function(rawMessage){
  syslogParser.parse(rawMessage.toString('utf8', 0), function(parsedMessage){
    // Create a mostly-unique hash for the key
    var hash = crypto.createHash('sha1')
    hash.update(JSON.stringify(parsedMessage))
    hash.update(process.pid.toString())
    hash.update(new Date().toString())

    // Store the parsed message in Riak Search
    db.save('syslog', hash.digest('hex'), parsedMessage)
  })
})

// Log the startup
server.on("listening", function(){
  var address = server.address()
  console.log("Syslog server listening at " + address.address + ":" + address.port)
})

server.on("close", function(){
  console.log("Syslog server shutting down.")
})

server.bind(514)
