{schema,
  [
   {version, "0.1"},
   {default_field, "originalMessage"},
   {default_op, "or"},
   {n_val, 3},
   {analyzer_factory, {erlang, text_analyzers, noop_analyzer_factory}}
  ],
  [
   {field, [{name, "id"},
            {required, true}]},
   {field, [{name, "originalMessage"},
            {required, true},
            {analyzer_factory, {erlang, text_analyzers, whitespace_analyzer_factory}}]},
   {field, [{name, "facility"}]},
   {field, [{name, "severity"}]},
   {field, [{name, "version"}]},
   {field, [{name, "host"}]},
   {field, [{name, "time"},
            {type, date}]},
   {field, [{name, "message"},
            {analyzer_factory, {erlang, text_analyzers, whitespace_analyzer_factory}}]},
   % Skip anything we don't care about
   {dynamic_field, [{name, "*"},
                    {skip, true}]}
  ]
 }.
