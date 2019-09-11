'use strict'

const { stringify } = require('querystring')
const humanizeUrl = require('humanize-url')
const { readFileSync } = require('fs')
const prettyMs = require('pretty-ms')
const { send } = require('micro')
const path = require('path')
const pupa = require('pupa')

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

const getData = async (res, { reset, ...query }, params) => {
  const { _: id } = params
  if (id === '') return { id }
  let data = reset === undefined && (await db.get(id))
  if (data) return { ...data, id }
  data = { createdAt: Date.now(), ...query }
  await db.set(id, data)
  return { ...data, id }
}

const indexHtml = ({ createdAt, id }, query) => {
  const { theme: skin = 'light' } = query
  const theme = themes[skin]

  const absoluteUrl = encodeURIComponent(
    `${META.homepage}/${id}?${stringify({
      theme: skin
    })}`
  )

  return pupa(indexTemplate.toString(), {
    ...theme,
    ...query,
    ...META,
    imageUrl: previewUrl(absoluteUrl, skin),
    absoluteUrl
  })
}

const templateHtml = ({ createdAt, id }, query) => {
  let {
    text = 'since last incident',
    theme: skin = 'light',
    quote = ''
  } = query
  const timeAgo = prettyMs(Date.now() - createdAt, { compact: true })
  const theme = themes[skin]
  if (quote && !quote.startsWith('“')) quote = `“${quote}”`

  const absoluteUrl = encodeURIComponent(
    `${META.homepage}/${id}?${stringify({
      theme: skin,
      text,
      quote
    })}`
  )

  return pupa(template.toString(), {
    ...theme,
    ...query,
    ...META,
    imageUrl: previewUrl(absoluteUrl, skin),
    absoluteUrl,
    id,
    timeAgo,
    text,
    quote
  })
}

const sendHtml = async (res, query, params) => {
  try {
    const data = await getData(res, query, params)
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

module.exports = sendHtml
