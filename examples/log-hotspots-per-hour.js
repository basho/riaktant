var config = require("../config/riak.js");
var riak = require('riak-js').getClient(config);

var from = "2011-02-10T15:12:00.000Z";
var to = "2011-02-20T15:13:36.000Z";

riak.addSearch('syslog', 'time:["' + from + '" TO "' + to + '"]').map(function(v) {
  var values = Riak.mapValuesJson(v);
  var matches = values[0].time.match(/^([0-9-]{10,10})T([0-9]{2,2}).+$/);
  var logHour = matches[1] + " " + matches[2] + " o'clock";
  var entry = {}
  entry[logHour] = 1;
  return [entry];
}).reduce(function(values) {
  var result = {};
  for (value in values) {
    for (host in values[value]) {
      if (host in result) {
        result[host] += values[value][host];
      } else {
        result[host] = values[value][host];
      }
    }
  }
  return [result];
}).run()
