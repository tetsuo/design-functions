#!/usr/bin/env node

const args = process.argv.slice(2)

if (!args.length) {
  console.log('usage: designfun DIR')
  process.exit(1)
}

require('./lib/bin')
