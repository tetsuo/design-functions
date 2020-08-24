# @tetsuo/design-functions

babelify and print couchdb design functions.

# example

```
SOURCEDIR=example/app
DOCNAME=myapp

echo \
  "{\"_id\": \"_design/$DOCNAME\", \"language\": \"javascript\"}" \
  "$(npx @tetsuo/design-functions $(find -E $SOURCEDIR -type f -name "*.js"  | tr '\n' ' ') \
    --babelify '{"plugins":[],"presets":[["@babel/preset-env",{"loose":true}]],"babelrc":false,"ast":false,"comments":false,"sourceMaps":false}')" \
  | jq -s add
```

Directory structure:

```
example/app/
├── shows/
│   └── foo.js
├── updates/
│   └── baz.js
├── filters/
│   └── bla.js
├── views/
│   ├── bar.map.js
│   └── bar.reduce.js
└── validate_doc_update.js
```

Every file should export a default function only. `map` functions should look like this:

```js
export default emit => doc => emit(...)
```

