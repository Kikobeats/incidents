'use strict'

const { readFileSync, readdirSync } = require('fs')
const dispatch = require('micro-route/dispatch')
const { send } = require('micro')
const path = require('path')

const { sendAsset, sendContent } = require('./send')

const assets = readdirSync('assets').reduce((acc, assetName) => {
  const assetPath = path.resolve('assets', assetName)
  return { ...acc, [assetName]: readFileSync(assetPath) }
}, {})

module.exports = dispatch()
  .dispatch('/*', 'GET', (req, res, { params = {}, query = {} } = {}) => {
    const asset = assets[req.url.substring(1)]
    return asset ? sendAsset(res, asset) : sendContent(res, query, params)
  })
  .otherwise((req, res) => send(res, 403, null))
