const acorn = require('acorn')

const isObject = u => typeof u === 'object' && u !== null

module.exports = (source, _type) =>
  acorn
    .parse(source, { ecmaVersion: '5' })
    .body.filter(
      d =>
        !(
          isObject(d) &&
          isObject(d.expression) &&
          isObject(d.expression.left) &&
          isObject(d.expression.left.object) &&
          d.expression.left.object.name === 'exports'
        )
    )
    .reduce((acc, d) => {
      let { start, end, type } = d
      let init
      let params
      let body
      if (
        _type !== 'Lib' &&
        type === 'VariableDeclaration' &&
        Array.isArray(d.declarations) &&
        d.declarations.length === 1 &&
        d.declarations[0].type === 'VariableDeclarator' &&
        isObject(d.declarations[0].id) &&
        d.declarations[0].id.name === '_default' &&
        isObject(d.declarations[0].init) &&
        d.declarations[0].init.type === 'FunctionExpression' &&
        isObject(d.declarations[0].init.body) &&
        d.declarations[0].init.body.type === 'BlockStatement' &&
        Array.isArray(d.declarations[0].init.body.body) &&
        Array.isArray(d.declarations[0].init.params)
      ) {
        init = d.declarations[0].init
        if (_type !== 'Map') {
          params = init.params
          body = init.body.body
        } else {
          init = init.body.body[0]
          if (
            isObject(init) &&
            init.type === 'ReturnStatement' &&
            isObject(init.argument) &&
            Array.isArray(init.argument.params) &&
            isObject(init.argument.body) &&
            Array.isArray(init.argument.body.body)
          ) {
            params = init.argument.params
            body = init.argument.body.body
          } else {
            acc.push(source.slice(start, end).trim())
            return acc
          }
        }
        acc.unshift('function(' + params.map(d => d.name).join(',') + ') {')
        acc.push(...body.map(d => source.slice(d.start, d.end)))
        acc.push('}')
      } else if (
        _type !== 'Lib' &&
        d.type === 'FunctionDeclaration' &&
        isObject(d.id) &&
        d.id.name === '_default' &&
        isObject(d.body) &&
        d.body.type === 'BlockStatement' &&
        Array.isArray(d.params) &&
        Array.isArray(d.body.body)
      ) {
        acc.unshift('function(' + d.params.map(d => d.name).join(',') + ') {')
        acc.push(...d.body.body.map(d => source.slice(d.start, d.end)))
        acc.push('}')
      } else {
        acc.push(source.slice(start, end).trim())
      }
      return acc
    }, [])
    .join('\n')
