syslogProducer = require('glossy').Produce
dgram = require('dgram')

producer = new syslogProducer()
host = "localhost"

services = ['sendmail', 'ntpd', 'ftpd', 'sshd', 'nginx']
messages = [
  'Client disconnected',
  'Connection to node.basho.com closed unexpectedly',
  'Rotated logs',
  'Client process died before closing connection, cleaning up',
  'Received unexpected packet from remote host'
]

severities = [
    "emerg",    # Emergency: system is unusable
    "alert",    # Alert: action must be taken immediately
    "crit",     # Critical: critical conditions
    "err",      # Error: error conditions
    "warn",     # Warning: warning conditions
    "notice",   # Notice: normal but significant condition
    "info",     # Informational: informational messages
    "debug"     # Debug: debug-level messages
]

facilities = [
    "kern",     # kernel messages
    "user",     # user-level messages
    "mail",     # mail system
    "daemon",   # system daemons
    "auth",     # security/authorization messages
    "syslog",   # messages generated internally by syslogd
    "lpr",      # line printer subsystem
    "news",     # network news subsystem
    "uucp",     # UUCP subsystem
    "clock",    # clock daemon
    "sec",      # security/authorization messages
    "ftp",      # FTP daemon
    "ntp",      # NTP subsystem
    "audit",    # log audit
    "alert",    # log alert
    "clock",    # clock daemon (note 2)
    "local0",   # local use 0  (local0)
    "local1",   # local use 1  (local1)
    "local2",   # local use 2  (local2)
    "local3",   # local use 3  (local3)
    "local4",   # local use 4  (local4)
    "local5",   # local use 5  (local5)
    "local6",   # local use 6  (local6)
    "local7",   # local use 7  (local7)
]

hosts = ['app1.basho.com', 'web2.basho.com', 'node5.riak.basho.com', 'lb.basho.com']

dgram = require('dgram')
client = dgram.createSocket("udp4")

date = () ->
  minute = parseInt(Math.random() * 100) % 60
  hour = parseInt(Math.random() * 100) % 24
  d = new Date()
  d.setHours(hour)
  d.setMinutes(minute)
  d

for i in [0...1000]
  facility = parseInt(Math.random() * 100) % facilities.length
  facility = 1 if facility == 0
  severity = parseInt(Math.random() * 100) % severities.length
  severity = 1 if severity == 0
  hsh =
    facility: facilities[facility],
    severity: severities[severity],
    host: hosts[parseInt(Math.random() * 100) % hosts.length],
    app_id: services[parseInt(Math.random() * 100) % services.length],
    pid: parseInt(Math.random() * 100000) % 65535,
    date: date(),
    message: messages[parseInt(Math.random() * 100) % messages.length]

  msg = producer.produce(hsh)
  console.log(msg)
  message = new Buffer(msg)
  client.send(message, 0, message.length, 10514, host)

client.close()
