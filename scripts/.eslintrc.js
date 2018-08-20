'use strict';

const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  env: {
    'node': true,
  },
  rules: {
    'arrow-parens': OFF,
    'brace-style': OFF,
    'camelcase': OFF,
    'comma-dangle': [ERROR, 'always-multiline'],
    'consistent-return': OFF,
    'indent': OFF,
    'max-params': OFF,
    'multiline-ternary': OFF,
    'no-console': OFF,
    'no-else-return': OFF,
    'no-unused-vars': WARNING,
    'object-curly-spacing': OFF,
    'quote-props': OFF,
    'quotes': OFF,
    'space-before-function-paren': OFF,
    'spaced-comment': OFF,
    'strict': OFF,
    'valid-jsdoc': OFF,
  }
};
