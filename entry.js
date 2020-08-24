const path = require('path')
const rewriteRequires = require('transform-deps')
const parse = require('./parse')

const USE_STRICT = '"use strict";\n\n'

const EXPORTS_ESMODULE = 'exports.__esModule = true;\n'

const removeIfStartsWith = toremove => s => (s.startsWith(toremove) ? s.slice(toremove.length) : s)

const removeIfEndsWith = toremove => s => (s.endsWith(toremove) ? s.slice(0, toremove.length * -1) : s)

module.exports = (sorted, d, isEntry) => {
  const baseName = path.basename(d.file)
  const baseNameNoExt = baseName.split('.').slice(0, -1).join('.')
  const source = rewriteRequires(
    [USE_STRICT, EXPORTS_ESMODULE].map(removeIfStartsWith).reduce((s, f) => f(s), d.source),
    n => (d.deps[n] ? (isEntry ? 'views/lib/' : './') + sorted.find(x => x.file === d.deps[n]).index : n)
  )
  const dirName = path.basename(path.dirname(d.file))
  const type = isEntry
    ? dirName === 'views'
      ? baseNameNoExt.endsWith('.reduce')
        ? 'Reduce'
        : 'Map'
      : dirName === 'filters'
      ? 'Filter'
      : dirName === 'updates'
      ? 'Update'
      : baseName === 'validate_doc_update.js'
      ? 'ValidateDocumentUpdate'
      : null
    : 'Lib'
  return {
    source: isEntry ? parse(source, type) : source,
    id: d.index,
    name: ['.reduce', '.map'].map(removeIfEndsWith).reduce((s, f) => f(s), baseNameNoExt),
    type
  }
}
