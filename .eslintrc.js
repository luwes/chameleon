'use strict';

const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  extends: 'eslint:recommended',
  env: {
    'es6': true,
    'node': true,
  },
  globals: {
    '__DEBUG__': false,
    '__DEV__': false,
  },
  parserOptions: {
    'ecmaVersion': 9,
    "sourceType": "module",
  },
  rules: {
    'indent': [ERROR, 2, {
      'ignoreComments': true,
      'SwitchCase': 1,
      'MemberExpression': 'off'
    }],
    'no-bitwise': OFF,
    'no-confusing-arrow': ['error', { 'allowParens': true }],
    'no-console': WARNING,
    'no-multiple-empty-lines': [ERROR, { 'max': 3 }],
    'no-negated-condition': OFF,
    'no-template-curly-in-string': OFF,
    'no-unneeded-ternary': WARNING,
    'no-use-before-define': [ERROR, 'nofunc'],
    'no-var': OFF,
    'object-shorthand': [ERROR, 'properties'],
    'prefer-arrow-callback': OFF,
    'prefer-const': OFF,
    'prefer-rest-params': WARNING,
    'prefer-template': OFF,
  }
};
