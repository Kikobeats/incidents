'use strict'

const dispatch = require('micro-route/dispatch')
const { send } = require('micro')

const sendHtml = require('./send')

module.exports = dispatch()
  .dispatch('/*', 'GET', (req, res, { params = {}, query = {} } = {}) =>
    sendHtml(res, query, params)
  )
  .otherwise((req, res) => send(res, 403, null))
