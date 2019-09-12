'use strict'

const { stringify } = require('querystring')
const humanizeUrl = require('humanize-url')
const { readFileSync } = require('fs')
const prettyMs = require('pretty-ms')
const { send } = require('micro')
const path = require('path')
const pupa = require('pupa')
const ms = require('ms')

const template = readFileSync(path.resolve('src', 'template.html'))
const indexTemplate = readFileSync(path.resolve('src', 'index.html'))

const db = require('./db')

const pkg = require('../package.json')

const META = {
  name: pkg.name,
  description: pkg.description,
  homepage: pkg.homepage,
  humanHomepage: humanizeUrl(pkg.homepage),
  faviconUrl: `${pkg.homepage}/favicon.ico`
}

const previewUrl = (url, skin) =>
  `https://api.microlink.io?url=${url}&screenshot&browser=${skin}&embed=screenshot.url`

const createSend = (status, statusCode) => (res, args) =>
  send(res, statusCode, { status, ...args })

const sendFail = createSend('fail', 400)

const themes = {
  light: {
    bgColor: 'white',
    timeFont: 'code',
    timeColor: 'black',
    textColor: 'black',
    textFont: 'sans-serif',
    quoteFont: 'helvetica',
    quoteColor: 'moon-gray'
  },
  dark: {
    bgColor: 'black',
    timeFont: 'code',
    timeColor: 'white',
    textColor: 'white',
    textFont: 'sans-serif',
    quoteFont: 'helvetica',
    quoteColor: 'gray'
  }
}

const upsert = async ({ reset, since, ...query }, params) => {
  const { _: id } = params
  if (id === '') return { id }
  let data = reset === undefined && (await db.get(id))
  if (data) return { ...data, id }
  const createdAt = since ? Date.now() - ms(since) : Date.now()
  data = { createdAt, ...query }
  await db.set(id, data)
  return { ...data, id }
}

const getData = async (query, params) => {
  const { createdAt, id, ...data } = await upsert(query, params)
  const {
    theme: skin = 'light',
    text = 'since last incident',
    quote = ''
  } = query

  const theme = themes[skin]
  const timeAgo = createdAt
    ? prettyMs(Date.now() - createdAt, { compact: true })
    : undefined

  const absoluteUrl = encodeURIComponent(
    `${META.homepage}/${id}?${stringify({
      theme: skin,
      text,
      quote
    })}`
  )

  return {
    ...theme,
    ...query,
    ...META,
    ...data,
    id,
    imageUrl: previewUrl(absoluteUrl, skin),
    absoluteUrl,
    timeAgo,
    text,
    quote
  }
}

const indexHtml = data => pupa(indexTemplate.toString(), data)

const templateHtml = data => pupa(template.toString(), data)

const sendHtml = async (res, query, params) => {
  try {
    const data = await getData(query, params)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    send(
      res,
      200,
      Buffer.from((data.id === '' ? indexHtml : templateHtml)(data, query))
    )
  } catch (err) {
    console.error(err)
    return sendFail(res, { message: err.message })
  }
}

const sendJSON = async (res, query, params) => {
  try {
    const data = await getData(query, params)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    send(res, 200, data)
  } catch (err) {
    console.error(err)
    return sendFail(res, { message: err.message })
  }
}

module.exports = (res, query, params) =>
  (query.json === undefined ? sendHtml : sendJSON)(res, query, params)
