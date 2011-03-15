var mapFunctions = {
  // Extracts the host from the message
  fetch_host: function(v) {
     var values = Riak.mapValuesJson(v);
     var host = {};
     host[values[0].host] = 1;
     return [host];
  },
  // Extracts the date and hour-of-day from the message
  date_and_hour: function(v) {
    var values = Riak.mapValuesJson(v);
    var matches = values[0].time.match(/^([0-9-]{10,10})T([0-9]{2,2}).+$/);
    var logHour = matches[1] + " " + matches[2] + " o'clock";
    var entry = {}
    entry[logHour] = 1;
    return [entry];
  },
  // Extracts the hour-of-day from the message (with no date)
  hour_of_the_day: function(v) {
    var values = Riak.mapValuesJson(v);
    var hourOfTheDay = values[0].time.match(/^[0-9-]{10,10}T([0-9]{2,2}).+$/)[1];
    var entry = {}
    entry[hourOfTheDay] = 1;
    return [entry];
  }
};

var reduceFunctions = {
  // Aggregates a count for each key in the input
  group_by_values: function(values) {
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
  },
  // Finds the top 5 values from the aggregate input
  top_five: function(values) {
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
  }
}

module.exports = {'map': mapFunctions, 'reduce': reduceFunctions}
