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

// Enqueue a log message when received
server.on("message", function(rawMessage){
  packetsReceived++;
  syslogParser.parse(rawMessage.toString('utf8', 0), function(parsedMessage){
    // Create a mostly-unique hash for the key
    // If using HTTP, this could be created for us
    var hash = crypto.createHash('sha1')
    hash.update(JSON.stringify(parsedMessage))
    hash.update(process.pid.toString())
    hash.update(new Date().toString())

    // Store the parsed message in Riak Search
    messageQueue.push([hash.digest("hex"), parsedMessage]);
  })
})

server.drainFreq = 500
server.drainInterval = null
server.logFreq = 5000
server.logInterval = null

var processNextQueueMessage = function(){
  if(messageQueue.length > 0){
    var message = messageQueue.shift()
    db.save('syslog', message[0], message[1], processNextQueueMessage)
  } else {
    console.log("Queue drained")
    server.drainInterval = setInterval(drainQueue, server.drainFreq)
  }
}

var drainQueue = function(){
  if(messageQueue.length > 100){
    console.log("Queue size: "+ messageQueue.length)
    clearInterval(drainInterval)
    process.nextTick(processNextQueueMessage)
  }
}

// Log the startup, start our periodic timers
server.on("listening", function(){
  var address = server.address()
  console.log("Syslog server listening at " + address.address + ":" + address.port)

  // Print to the console the message count on an interval
  if(server.logFreq > 0){
    server.logInterval = setInterval(function() {
      console.log("received " + packetsReceived + " messages so far");
    }, 5000)
  }

  // Drain the queue regularly
  if(server.drainFreq > 0){
    server.drainInterval = setInterval(drainQueue, server.drainFreq)
  }
})

// Log shutdown
server.on("close", function(){
  console.log("Syslog server shutting down.")
  clearInterval(server.drainInterval)
  clearInterval(server.logInterval)
})

module.exports = server
