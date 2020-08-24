# @tetsuo/design-functions

```
SOURCEDIR=example/app
DOCNAME=myapp

echo \
  "{\"_id\": \"_design/$DOCNAME\", \"language\": \"javascript\"}" \
  "$(node bin.js $(find -E $SOURCEDIR -type f -name "*.js"  | tr '\n' ' ') \
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
