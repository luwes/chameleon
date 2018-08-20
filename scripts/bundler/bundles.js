'use strict';

const bundleTypes = {
  ES_DEV: 'ES_DEV',
  ES_PROD: 'ES_PROD',
  CSS_DEV: 'CSS_DEV',
  CSS_PROD: 'CSS_PROD',
};

const ES_DEV = bundleTypes.ES_DEV;
const ES_PROD = bundleTypes.ES_PROD;
const CSS_DEV = bundleTypes.CSS_DEV;
const CSS_PROD = bundleTypes.CSS_PROD;

const moduleTypes = {
  BASIC: 'BASIC',
};

const BASIC = moduleTypes.BASIC;

const bundles = [
  /******* Cricket *******/
  {
    label: 'cricket',
    bundleTypes: [
      ES_DEV,
      ES_PROD,
    ],
    moduleType: BASIC,
    entry: 'cricket',
    global: 'cricket',
    externals: [],
  },
  /******* Grasshopper *******/
  {
    label: 'grasshopper',
    bundleTypes: [
      ES_DEV,
      ES_PROD,
    ],
    moduleType: BASIC,
    entry: 'grasshopper',
    global: 'grasshopper',
    externals: [],
  },
];

// Based on deep-freeze by substack (public domain)
function deepFreeze(o) {
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(function(prop) {
    if (
      o[prop] !== null &&
      (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}

// Don't accidentally mutate config as part of the build
deepFreeze(bundles);

module.exports = {
  bundleTypes,
  moduleTypes,
  bundles,
};
