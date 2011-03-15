// Require needed libraries and config
var config = require("../../config/config.js"),
    syslogParser = require('glossy').Parse,
    dgram = require('dgram'),
    riak = require('riak-js'),
    crypto = require('crypto')

// Create a Riak client
var db = riak.getClient(config)

// Create the UDP syslog server
var server = dgram.createSocket("udp4")

// Measure perf and reduce backpressure
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

// Check the queue size every 0.5 seconds
server.drainFreq = 500
server.drainInterval = null

// Log the queue size every 5 seconds
server.logFreq = 5000
server.logInterval = null

// Process a message from the queue until it's empty
var processNextQueueMessage = function(){
  if(messageQueue.length > 0){
    var message = messageQueue.shift()
    db.save('syslog', message[0], message[1], processNextQueueMessage)
  } else {
    console.log("Queue drained")
    server.drainInterval = setInterval(drainQueue, server.drainFreq)
  }
}

// Don't start draining the queue until there's some messages in it
var drainQueue = function(){
  if(messageQueue.length > 100){
    console.log("Queue size: "+ messageQueue.length)
    // Stop polling until it's drained
    clearInterval(server.drainInterval)
    // Schedule message processing for the next cycle
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
