'use strict'

const { stringify } = require('querystring')
const { readFileSync } = require('fs')
const prettyMs = require('pretty-ms')
const { send } = require('micro')
const path = require('path')
const pupa = require('pupa')

const template = readFileSync(path.resolve('src', 'template.html'))
const db = require('./db')

const pkg = require('../package.json')

const META = {
  name: pkg.name,
  description: pkg.description,
  homepage: pkg.homepage,
  logoUrl: `${pkg.homepage}/logo.png`,
  faviconUrl: `${pkg.homepage}/favicon.ico`
}

const createSend = (status, statusCode) => (res, args) =>
  send(res, statusCode, { status, ...args })

const sendFail = createSend('fail', 400)

const themes = {
  light: {
    bgColor: 'white',
    timeFont: 'code',
    timeColor: 'black',
    textColor: 'gray',
    textFont: 'avenir',
    quoteFont: 'times',
    quoteColor: 'moon-gray'
  },
  dark: {
    bgColor: 'black',
    timeFont: 'code',
    timeColor: 'white',
    textColor: 'moon-gray',
    textFont: 'avenir',
    quoteFont: 'times',
    quoteColor: 'gray'
  }
}

const getData = async (res, { reset, ...query }, params) => {
  const { _: id } = params
  if (id === '') throw new Error('`id` is missing.')
  let data = reset === undefined && (await db.get(id))
  if (data) return { ...data, id }
  data = { createdAt: Date.now(), ...query }
  await db.set(id, data)
  return { ...data, id }
}

const sendHtml = async (res, query, params) => {
  try {
    const { id, createdAt } = await getData(res, query, params)
    let {
      text = 'since last incident',
      theme: skin = 'light',
      quote = ''
    } = query
    const timeAgo = prettyMs(Date.now() - createdAt)
    const theme = themes[skin]
    if (quote) quote = `“${quote}”`
    res.setHeader('Content-Type', 'text/html; charset=utf-8')

    const absoluteUrl = `${META.homepage}/${id}?${stringify({
      theme,
      text,
      quote
    })}`

    return Buffer.from(
      pupa(template.toString(), {
        ...theme,
        ...query,
        ...META,
        absoluteUrl,
        id,
        timeAgo,
        text,
        quote
      })
    )
  } catch (err) {
    return sendFail(res, { message: err.message })
  }
}

module.exports = sendHtml
