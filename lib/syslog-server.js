// Require needed libraries and config
var config = require("../config/riak.js"),
    syslogParser = require('glossy').Parse,
    dgram = require('dgram'),
    riak = require('riak-js'),
    crypto = require('crypto')

// Create a Riak client that uses the Protocol Buffers interface
var db = riak.getClient(config)

// Create the UDP syslog server
var server = dgram.createSocket("udp4")

// Measure perf and reduce undue backpressure
var packetsReceived = 0;
var messageQueue = [];

server.on("message", function(rawMessage){
  packetsReceived++;
  syslogParser.parse(rawMessage.toString('utf8', 0), function(parsedMessage){
    // Create a mostly-unique hash for the key
    var hash = crypto.createHash('sha1')
    hash.update(JSON.stringify(parsedMessage))
    hash.update(process.pid.toString())
    hash.update(new Date().toString())

    // Store the parsed message in Riak Search
    messageQueue.push([hash.digest("hex"), parsedMessage]);
  })
})

// Log the startup
server.on("listening", function(){
  var address = server.address()
  console.log("Syslog server listening at " + address.address + ":" + address.port)
})

// Log shutdown
server.on("close", function(){
  console.log("Syslog server shutting down.")
})

// Startup on the default syslog port
server.bind(514)

// Print to the console the message count
setInterval(function() {
  console.log("received " + packetsReceived + " messages so far");
}, 5000)

// Drain the message queue every 30 seconds
var drainQueue = function(){
  console.log("Queue size: "+ messageQueue.length)
  if(messageQueue.length > 100){
    console.log("Draining queue of 100 messages.")
    for(var i = 0; i < 100; i++){
      var message = messageQueue.shift()
      db.save('syslog', message[0], message[1])
    }
  }
}
setInterval(drainQueue, 5000)
