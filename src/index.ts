import path from 'path'
import glob from 'glob'
import { parse } from 'acorn'
import { node, attempt, parallel as _parallel } from 'fluture'
import { pipe, flow } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import * as t from 'io-ts'
import * as F from 'fp-ts-fluture/lib/Future'
import * as A from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import * as R from 'fp-ts/lib/Record'
import * as NEA from 'fp-ts/lib/NonEmptyArray'
import _resolve from './resolve'

const rewriteRequires = require('transform-deps')
const presetEnv = require('@babel/preset-env')

const parallel = _parallel(Infinity)

const BABEL_DEFAULTS = {
  plugins: [],
  presets: [[presetEnv, { loose: true, targets: { esmodules: false } }]],
  babelrc: false,
  ast: false,
  comments: false,
  sourceMaps: false
}

const ENTRIES_GLOB_PATTERN = '{**/+(views|filters|updates)/*.js,validate_doc_update.js}'

const lit = t.literal

const type = t.interface

const Node = type({
  type: t.string,
  start: t.number,
  end: t.number
})

const ObjectDefineESModuleProperty = type({
  type: lit('ExpressionStatement'),
  expression: type({
    type: lit('CallExpression'),
    arguments: t.tuple([
      type({
        type: lit('Identifier')
      }),
      type({
        type: lit('Literal'),
        value: lit('__esModule')
      }),
      type({
        type: lit('ObjectExpression')
      })
    ]),
    callee: type({
      type: lit('MemberExpression'),
      object: type({
        type: lit('Identifier'),
        name: lit('Object')
      }),
      property: type({
        type: lit('Identifier'),
        name: lit('defineProperty')
      })
    })
  })
})

const UseStrict = type({
  directive: lit('use strict'),
  expression: Node,
  type: lit('ExpressionStatement')
})

const DefaultFunctionExpression = type({
  type: lit('ExpressionStatement'),
  expression: type({
    type: lit('AssignmentExpression'),
    operator: t.literal('='),
    left: type({
      type: t.literal('MemberExpression'),
      object: type({
        type: lit('Identifier'),
        name: lit('exports')
      }),
      property: type({
        type: lit('Literal'),
        value: lit('default')
      })
    }),
    right: t.intersection([
      Node,
      type({
        type: lit('CallExpression')
      })
    ])
  })
})

const Program = type({
  body: t.array(Node)
})

const entries = (cwd: string) =>
  node<Error, Array<string>>(done =>
    glob(ENTRIES_GLOB_PATTERN, { realpath: true, silent: true, cwd: path.resolve(cwd), nodir: true }, done)
  )

interface Module {
  id: string
  source: string
  file: string
  index: number
  deps: { [key: string]: string }
}

type CouchModuleType = 'Reduce' | 'Map' | 'Update' | 'Filter' | 'ValidateDocUpdate' | 'Lib'

interface CouchModule extends Module {
  type: CouchModuleType
  name: string
}

const designFunctionType = (x: Pick<CouchModule, 'type' | 'name' | 'source'>) =>
  x.type === 'Map' || x.type === 'Reduce' || x.type === 'Lib'
    ? 'views'
    : x.type === 'Filter'
    ? 'filters'
    : x.type === 'Update'
    ? 'updates'
    : 'validate_doc_update'

const couchModule = (entries: Array<string>, ix: Array<Module>) => (m: Module): O.Option<CouchModule> => {
  const { id: file } = m
  const baseName = path.basename(file)
  const baseNameNoExt = baseName.split('.').slice(0, -1).join('.')
  const dirName = path.basename(path.dirname(file))
  const isEntry = entries.indexOf(m.id) >= 0
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
      ? 'ValidateDocUpdate'
      : null
    : 'Lib'
  if (!type) {
    return O.none
  }
  return O.some({
    ...m,
    ...{
      name: pipe(
        A.array.map(['.reduce', '.map'], (t: string) => (s: string) => (s.endsWith(t) ? s.slice(0, t.length * -1) : s)),
        A.reduce(baseNameNoExt, (b, a) => a(b))
      ),
      type,
      source: rewriteRequires(m.source, (n: string) =>
        m.deps[n] ? (isEntry ? 'views/lib/' : './') + ix.find(x => x.file === m.deps[n])?.index : n
      )
    }
  })
}

const parseCouchModule = (m: CouchModule) =>
  pipe(
    attempt<Error, acorn.Node>(() => parse(m.source, { ecmaVersion: 5 })),
    F.chain(
      flow(
        Program.decode,
        F.fromEither,
        F.mapLeft(E.toError),
        F.map(n =>
          pipe(
            A.array.filter(n.body, x => !(UseStrict.is(x) || ObjectDefineESModuleProperty.is(x))),
            A.reduce('', (acc, node) => {
              if (m.type === 'Map' && DefaultFunctionExpression.is(node)) {
                return (
                  'function(doc) {\n\n' +
                  acc +
                  '\n\n' +
                  'var default = ' +
                  m.source.slice(node.expression.right.start, node.expression.right.end) +
                  ';\n\n'
                )
              }
              return acc + m.source.slice(node.start, node.end)
            }),
            s => (m.type === 'Map' ? s + 'default(doc)(log)\n\n}' : s)
          )
        )
      )
    ),
    F.map(source => ({
      name: m.type === 'Lib' ? String(m.index) : m.name,
      type: m.type,
      source
    }))
  )

const functions = (entries: Array<string>) =>
  pipe(
    node<Error, Array<Module>>(done => _resolve(entries, BABEL_DEFAULTS, done)),
    F.map(ix => A.array.filterMap(ix, couchModule(entries, ix))),
    F.chain(flow(A.map(parseCouchModule), parallel))
  )

export const designfun = flow(
  entries,
  F.chain(functions),
  F.chain(
    F.fromPredicate(
      xs => xs.length > 0,
      () => new Error('No functions found')
    )
  ),
  F.map(xs =>
    pipe(
      xs,
      NEA.groupBy(designFunctionType),
      R.mapWithIndex((key, value) =>
        key === 'views'
          ? pipe(
              A.array.partition(value, x => x.type === 'Lib'),
              ({ left: views, right: lib }) =>
                pipe(
                  views,
                  NEA.groupBy(x => x.name),
                  R.map(A.reduce({}, (b, a) => ({ ...b, ...{ [a.type.toLowerCase()]: a.source } }))),
                  R.insertAt(
                    'lib',
                    A.array.reduce(lib, {}, (b, a) => ({ ...b, ...{ [String(a.name)]: a.source } }))
                  )
                )
            )
          : key === 'validate_doc_update'
          ? value[0].source
          : pipe(
              value,
              NEA.groupBy(x => x.name),
              R.map(x => x[0].source)
            )
      )
    )
  )
)
