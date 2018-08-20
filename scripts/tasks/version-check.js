'use strict';

const sharedVersion = require('../../package.json').version;
const versions = {
  'packages/cricket/package.json': require('../../packages/cricket/package.json')
    .version,
  'packages/grasshopper/package.json': require('../../packages/grasshopper/package.json')
    .version,
  'packages/shared/version.js': require('../../packages/shared/version.js'),
};

let allVersionsMatch = true;
Object.keys(versions).forEach(function(name) {
  const version = versions[name];
  if (version !== sharedVersion) {
    allVersionsMatch = false;
    console.log(
      '%s version does not match package.json. Expected %s, saw %s.',
      name,
      sharedVersion,
      version
    );
  }
});

if (!allVersionsMatch) {
  process.exit(1);
}
