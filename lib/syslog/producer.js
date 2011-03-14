var syslogProducer = require('glossy').Produce,
    dgram = require('dgram');

var producer = new syslogProducer();
var host = "localhost";

var services = ['sendmail', 'ntpd', 'ftpd', 'sshd', 'nginx']
var messages = [
  'Client disconnected',
  'Connection to node.basho.com closed unexpectedly',
  'Rotated logs',
  'Client process died before closing connection, cleaning up',
  'Received unexpected packet from remote host' 
]

var severities = [
    "emerg",    // Emergency: system is unusable
    "alert",    // Alert: action must be taken immediately
    "crit",     // Critical: critical conditions
    "err",      // Error: error conditions
    "warn",     // Warning: warning conditions
    "notice",   // Notice: normal but significant condition
    "info",     // Informational: informational messages
    "debug"     // Debug: debug-level messages
];

var facilities = [
    "kern",     // kernel messages
    "user",     // user-level messages
    "mail",     // mail system
    "daemon",   // system daemons
    "auth",     // security/authorization messages
    "syslog",   // messages generated internally by syslogd
    "lpr",      // line printer subsystem
    "news",     // network news subsystem
    "uucp",     // UUCP subsystem
    "clock",    // clock daemon
    "sec",      // security/authorization messages
    "ftp",      // FTP daemon
    "ntp",      // NTP subsystem
    "audit",    // log audit
    "alert",    // log alert
    "clock",    // clock daemon (note 2)
    "local0",   // local use 0  (local0)
    "local1",   // local use 1  (local1)
    "local2",   // local use 2  (local2)
    "local3",   // local use 3  (local3)
    "local4",   // local use 4  (local4)
    "local5",   // local use 5  (local5)
    "local6",   // local use 6  (local6)
    "local7",   // local use 7  (local7)
];

var hosts = ['app1.basho.com', 'web2.basho.com', 'node5.riak.basho.com', 'lb.basho.com']

var dgram = require('dgram');
var client = dgram.createSocket("udp4");
var msg;

function date() {
  var minute = parseInt(Math.random() * 100) % 60;
  var hour = parseInt(Math.random() * 100) % 24;
  var date = new Date();
  date.setHours(hour);
  date.setMinutes(minute);
  return date;
}

for (var i = 0; i < 1000; i++) {
  var facility = parseInt(Math.random() * 100) % facilities.length;
  if (facility == 0) facility = 1;
  var severity = parseInt(Math.random() * 100) % severities.length;
  if (severity == 0) severity = 1;
  var hsh = {
    facility: facilities[facility],
    severity: severities[severity],
    host: hosts[parseInt(Math.random() * 100) % hosts.length],
    app_id: services[parseInt(Math.random() * 100) % services.length],
    pid: parseInt(Math.random() * 100000) % 65535,
    date: date(),
    message: messages[parseInt(Math.random() * 100) % messages.length]
  }
  var msg = producer.produce(hsh)
  console.log(msg);
  var message = new Buffer(msg);
  client.send(message, 0, message.length, 10514, host);
}

client.close();
