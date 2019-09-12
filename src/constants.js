'use strict'

const pkg = require('../package.json')

const { PORT = 1337, NODE_ENV = 'development' } = process.env

const isProduction = NODE_ENV === 'production'

const LOG_FORMAT =
  process.env.LOG_FORMAT || (NODE_ENV === 'development' && 'dev')

const URL = NODE_ENV !== 'production' ? 'http://localhost:3000' : pkg.homepage

module.exports = {
  ...process.env,
  isProduction,
  LOG_FORMAT,
  NODE_ENV,
  PORT,
  URL
}
