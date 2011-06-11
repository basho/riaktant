config = require '../../config/config'
syslogParser = require('glossy').Parse
dgram = require 'dgram'
riak = require('riak-js').getClient(config)
crypto = require 'crypto'

server = dgram.createSocket('udp4')

packetsReceived = 0
messageQueue = []

server.on "message", (rawMessage) ->
  packetsReceived++
  syslogParser.parse rawMessage.toString('utf8', 0), (parsedMessage) ->
    hash = crypto.createHash 'sha1'
    hash.update JSON.stringify(parsedMessage)
    hash.update process.pid.toString()
    
    messageQueue.push {key: hash.digest("hex"), value: parsedMessage}

server.drainFrequency = 500
server.drainInterval = null

server.logFrequency = 5000
server.logInterval = null

processNextQueueMessage = () ->
  if messageQueue.length > 0
    message = messageQueue.shift()
    riak.save 'syslog', message.key, message.value, processNextQueueMessage
  else
    console.log "Queue drained"
    server.drainInterval = setInterval drainQueue, server.drainFrequency

drainQueue = () ->
  if messageQueue.length > 100
    console.log "Queue size: #{messageQueue.length}"
    clearInterval(server.drainInterval)
    process.nextTick(processNextQueueMessage)

server.on "listening", () ->
  address = server.address()
  console.log "Syslog server is listening on #{address.address}:#{address.port}"

  if server.logFrequency > 0
    server.logInterval = setInterval () ->
      console.log("Received #{packetsReceived} messages so far.")
    , 5000
  
  if server.drainFrequency > 0
    server.drainInterval = setInterval drainQueue, server.drainFrequency

server.on "close", () ->
  console.log "Syslog server shutting down"
  clearInterval server.drainInterval
  clearInterval server.logInterval

module.exports = server
