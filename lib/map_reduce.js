var mapFunctions = {
  fetch_host: function(v) {
     var values = Riak.mapValuesJson(v);
     var host = {};
     host[values[0].host] = 1;
     return [host];
  }
};

var reduceFunctions = {
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
  }
}

module.exports = {'map': mapFunctions, 'reduce': reduceFunctions}
