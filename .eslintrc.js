module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    mocha: false,
    es6: true,
    browser: false
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint'
    // 'plugin:react/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      jsx: true
    },
    sourceType: 'module'
  },
  rules: {
    'no-constant-condition': 'warn',
    '@typescript-eslint/ban-types': 'off',
    semi: 'off',
    'arrow-parens': ['error', 'as-needed'],
    'space-before-function-paren': 'off',
    'variable-name': 'off',
    'ter-indent': 'off',
    'no-console': 'warn',
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    curly: 'error',
    deprecation: 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-triple-slash-reference': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    // 'react/display-name': 'off',
    // 'react/prop-types': 'off',
    'no-debugger': 'warn',
    'no-const-assign': 'error',
    'no-class-assign': 'error',
    'no-dupe-class-members': 'off',
    'no-var': 'error',
    'prefer-arrow-callback': 'error'
  }
}
