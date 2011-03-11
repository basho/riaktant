var config = require("../config/riak.js");
var riak = require('riak-js').getClient(config);

var from = "2011-02-10T15:12:00.000Z";
var to = "2011-02-10T15:13:36.000Z";

riak.addSearch('syslog', 'time:["' + from + '" TO "' + to + '"]').map(function(v) {
  var values = Riak.mapValuesJson(v);
  var host = {};
  host[values[0].host] = 1;
  return [host];
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
