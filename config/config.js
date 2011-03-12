var fs = require('fs');
var configFile = {};

if (process.env['RIAK_CONFIG'] != null) {
  configFile = process.env['RIAK_CONFIG'];
} else {
  configFile = __dirname + "/riak.js";
}

var config = require(configFile);
module.exports = config;
