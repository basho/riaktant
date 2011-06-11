web = require('./lib/web/server')

web.listen(process.env.PORT or 8001)
