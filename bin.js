#!/usr/bin/env node

const path = require('path')
const resolve = require('./resolve')
const createEntry = require('./entry')
const presetEnv = require('@babel/preset-env')

const main = cb => {
  const argv = process.argv
    .slice(2)
    .reduce(
      (acc, x) =>
        Array.isArray(acc)
          ? Object.assign(acc[1], { [acc[0]]: JSON.parse(x) })
          : x === '--babelify'
          ? [x.slice(2), acc]
          : { entries: acc.entries.concat(path.resolve(x)) },
      { entries: [], babelify: {} }
    )

  const entries = argv.entries

  const babelify = argv.babelify

  let ix = -1

  if (
    Array.isArray(babelify.presets) &&
    (ix = babelify.presets.findIndex(d => Array.isArray(d) && d[0] === '@babel/preset-env')) >= 0
  ) {
    babelify.presets[ix][0] = presetEnv
  }

  resolve(entries, babelify, (er, res) =>
    cb(
      er || null,
      res &&
        res
          .map(d => createEntry(res, d, entries.indexOf(d.id) >= 0))
          .reduce(
            (acc, x) => {
              if (x.type === 'Reduce') {
                acc.views[x.name] = acc.views[x.name] || {}
                acc.views[x.name].reduce = x.source
              } else if (x.type === 'Map') {
                acc.views[x.name] = acc.views[x.name] || {}
                acc.views[x.name].map = x.source
              } else if (x.type === 'Filter') {
                acc.filters[x.name] = x.source
              } else if (x.type === 'Update') {
                acc.updates[x.name] = x.source
              } else if (x.type === 'ValidateDocumentUpdate') {
                acc.validate_doc_update = x.source
              } else if (x.type === 'Lib') {
                acc.views.lib[String(x.id)] = x.source
              }
              return acc
            },
            { views: { lib: {} }, updates: {}, filters: {} }
          )
    )
  )
}

module.exports = main

const exit = (code, msg) => {
  if (msg) {
    if (code === 0) {
      console.log(msg)
    } else {
      console.error(msg)
    }
  }
  process.exit(code)
}

if (!module.parent) {
  main((er, res) => (er ? exit(1, er.message) : console.log(JSON.stringify(res, null, 2))))
}
