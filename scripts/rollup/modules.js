'use strict';

// For any external that is used in a DEV-only condition, explicitly
// specify whether it has side effects during import or not. This lets
// us know whether we can safely omit them when they are unused.
// const HAS_NO_SIDE_EFFECTS_ON_IMPORT = false;
// const HAS_SIDE_EFFECTS_ON_IMPORT = true;
const importSideEffects = Object.freeze({
  // 'fbjs/lib/invariant': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  // 'fbjs/lib/warning': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  // 'prop-types/checkPropTypes': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  // 'fbjs/lib/camelizeStyleName': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  // 'fbjs/lib/hyphenateStyleName': HAS_NO_SIDE_EFFECTS_ON_IMPORT,
  // deepFreezeAndThrowOnMutationInDev: HAS_NO_SIDE_EFFECTS_ON_IMPORT,
});

// Bundles exporting globals that other modules rely on.
const knownGlobals = Object.freeze({

});

// Given ['react'] in bundle externals, returns { 'react': 'React' }.
function getPeerGlobals(externals, bundleType) {
  const peerGlobals = {};
  externals.forEach(name => {
    peerGlobals[name] = knownGlobals[name];
  });
  return peerGlobals;
}

// Determines node_modules packages that are safe to assume will exist.
function getDependencies(bundleType, entry) {
  // Replaces any part of the entry that follow the package name (like
  // "/server" in "react-dom/server") by the path to the package settings
  const packageJson = require(entry.replace(/(\/.*)?$/, '/package.json'));
  // Both deps and peerDeps are assumed as accessible.
  return Array.from(
    new Set([
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
    ])
  );
}

function getImportSideEffects() {
  return importSideEffects;
}

module.exports = {
  getImportSideEffects,
  getPeerGlobals,
  getDependencies,
};
