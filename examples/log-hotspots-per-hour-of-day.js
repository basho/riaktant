var config = require("../config/riak.js");
var riak = require('riak-js').getClient(config);

var from = "2011-02-10T15:12:00.000Z";
var to = "2011-02-20T15:13:36.000Z";

riak.addSearch('syslog', 'time:["' + from + '" TO "' + to + '"]').map(function(v) {
  var values = Riak.mapValuesJson(v);
  var hourOfTheDay = values[0].time.match(/^[0-9-]{10,10}T([0-9]{2,2}).+$/)[1];
  var entry = {}
  entry[hourOfTheDay] = 1;
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
}).reduce(function(values) {
  var mappedValues = values.map(function(value) {
    var mappedValue = []
    for (var k in value) {
      mappedValue.push([k, value[k]])
    }
    return mappedValue.sort(function(left, right) {
      if (left[1] > right[1]) {
        return -1;
      } else if (left[1] < right[1]) {
        return 1;
      }
      return 0;
    }).slice(0,5);
  });
  return mappedValues;
}).run()
