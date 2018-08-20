'use strict';

const Bundles = require('./bundles');
const sharedVersion = require('../../package.json').version;

const UMD_DEV = Bundles.bundleTypes.UMD_DEV;
const UMD_PROD = Bundles.bundleTypes.UMD_PROD;
const ES_DEV = Bundles.bundleTypes.ES_DEV;
const ES_PROD = Bundles.bundleTypes.ES_PROD;

const license = ` * Copyright (c) 2013-present, Chameleon, Inc.`;

const wrappers = {
  /***************** UMD_DEV *****************/
  [UMD_DEV](source, globalName, filename, moduleType) {
    return `/** @license Chameleon v${sharedVersion}
 *
 * ${filename}
 *
${license}
 */

'use strict';

${source}`;
  },

  /***************** UMD_PROD *****************/
  [UMD_PROD](source, globalName, filename, moduleType) {
    return `/** @license Chameleon v${sharedVersion}
 *
 * ${filename}
 *
${license}
 */
${source}`;
  },

  /***************** ES_DEV *****************/
  [ES_DEV](source, globalName, filename, moduleType) {
    return `/** @license Chameleon v${sharedVersion}
 *
 * ${filename}
 *
${license}
 */
${source}`;
  },

  /***************** ES_PROD *****************/
  [ES_PROD](source, globalName, filename, moduleType) {
    return `/** @license Chameleon v${sharedVersion}
 *
 * ${filename}
 *
${license}
 */
${source}`;
  },
};

function wrapBundle(source, bundleType, globalName, filename, moduleType) {
  // All the other packages.
  const wrapper = wrappers[bundleType];
  if (typeof wrapper !== 'function') {
    throw new Error(`Unsupported build type: ${bundleType}.`);
  }
  return wrapper(source, globalName, filename, moduleType);
}

module.exports = {
  wrapBundle,
};
