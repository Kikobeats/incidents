'use strict'

const { PORT = 1337, NODE_ENV = 'development' } = process.env

const isProduction = NODE_ENV === 'production'

const LOG_FORMAT =
  process.env.LOG_FORMAT || (NODE_ENV === 'development' && 'dev')

module.exports = {
  ...process.env,
  isProduction,
  LOG_FORMAT,
  NODE_ENV,
  PORT
}
