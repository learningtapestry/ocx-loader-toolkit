// blitz.config.js
const { connectMiddleware } = require("blitz")
import forceHttpsMiddlewareHAndler from 'next/dist/server/middleware/force-https'

module.exports = {
  // middleware: [
  //   connectMiddleware(forceHttpsMiddlewareHAndler)
  // ],
}

module.exports = config
