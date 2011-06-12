mapFunctions =
  # Extracts the host from the message
  fetch_host: (v) ->
     values = Riak.mapValuesJson(v)
     host = {}
     host[values[0].host] = 1
     [host]
  ,
  # Extracts the date and hour-of-day from the message
  date_and_hour: (v) ->
    values = Riak.mapValuesJson(v)
    matches = values[0].time.match(/^([0-9-]{10,10})T([0-9]{2,2}).+$/)
    logHour = matches[1] + " " + matches[2] + " o'clock"
    entry = {}
    entry[logHour] = 1
    [entry]
  ,
  # Extracts the hour-of-day from the message (with no date)
  hour_of_the_day: (v) ->
    values = Riak.mapValuesJson(v)
    hourOfTheDay = values[0].time.match(/^[0-9-]{10,10}T([0-9]{2,2}).+$/)[1]
    entry = {}
    entry[hourOfTheDay] = 1
    [entry]

reduceFunctions =
  # Aggregates a count for each key in the input
  group_by_values: (values) ->
    result = {}
    for value in values
      for host, num of value
        if result[host]
          result[host] += num
        else
          result[host] = num
    [result]
  ,
  # Finds the top 5 values from the aggregate input
  top_five: (values) ->
    values.map (value) ->
      mappedValue = []
      for k, v of value
        mappedValue.push {k: v}

      (mappedValue.sort (left, right) ->
        if left[1] > right[1]
          -1
        else if left[1] < right[1]
          1
        else
          0
      ).slice(0,5)[0]

module.exports = map: mapFunctions, reduce: reduceFunctions
