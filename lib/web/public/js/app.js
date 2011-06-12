var pie = null;
var graphMapReduceResults = function(results) {
  results = results[0];
  var values = [];
  var labels = [];
  for (var key in results) {
    values.push(results[key]);
    labels.push(key);
  }
  pie = Raphael(230, 0, 500, 350).g.piechart(150, 150, 100, values, {legend: labels, legendpos: 'east'});
  pie.hover(function() {
    this.sector.stop();
    this.sector.scale(1.1, 1.1, this.cx, this.cy);
    if (this.label) {
        this.label[0].stop();
        this.label[0].scale(1.5);
        this.label[1].attr({"font-weight": 800});
    }
  }, function() {
    this.sector.animate({scale: [1, 1, this.cx, this.cy]}, 500, "bounce");
    if (this.label) {
      this.label[0].animate({scale: 1}, 500, "bounce");
      this.label[1].attr({"font-weight": 400});
    }
  });
}

$(function() {
  for (var i in syslogFacilities) {
    $('#search-facilities').append($('<option/>').val(syslogFacilities[i][0]).text(syslogFacilities[i][1]));
  }
  
  $('#search-form').submit(function(event) {
    event.preventDefault();
    $.post('/search', $(this).serialize(), function(data) {
      if (data.results !== undefined) {
        $('pre#search-output').html('').html(data.results.map(function(result) {
            return result.fields.originalMessage;
        }).join("\n"));
      } else {
        $('pre#search-output').html('');
        if (pie !== null) {
          pie.remove();
        }
        if ($('#search_graph').attr('checked')) {
          graphMapReduceResults(data.mapreduce);
        } else {
          $('pre#search-output').html(JSON.stringify(data.mapreduce));
        }
      }
    });
  });

  $('#search_query').focus();

  $('#advanced-query-toggle').click(function(event) {
    event.preventDefault();
    $('#advanced-query').toggle('blind');
  });

  $('.timepicker').datetimepicker({
    timeFormat: "hh:mm",
    separator: 'T',
    dateFormat: "yy-mm-dd"
  });

  $('.function').change(function() {
    $('#search_map_reduce').attr('checked', true);
  });
});

