web = require "./lib/web/server"
syslog = require "./lib/syslog/server"
web.listen(process.env.PORT or 8001)
syslog.bind 10514
