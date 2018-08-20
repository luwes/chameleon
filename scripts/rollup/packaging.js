'use strict';

const fs = require('fs-extra');
const Bundles = require('../bundler/bundles');

const {
  asyncExecuteCommand,
  asyncExtractTar,
} = require('../bundler/utils');

const {
  ES_DEV,
  ES_PROD,
} = Bundles.bundleTypes;

const FILE_PROTOCOL_PREFIX = 'file:';
const LINK_PROTOCOL_PREFIX = 'link:';

function getPackageName(name) {
  if (name.indexOf('/') !== -1) {
    return name.split('/')[0];
  }
  return name;
}

function getBundleOutputPaths(bundleType, filename, packageName) {
  switch (bundleType) {
    case ES_DEV:
    case ES_PROD:
      return [`build/node_modules/${packageName}/es/${filename}`];
    default:
      throw new Error('Unknown bundle type.');
  }
}

function getTarOptions(tgzName, packageName) {
  // Files inside the `npm pack`ed archive start
  // with "package/" in their paths. We'll undo
  // this during extraction.
  const CONTENTS_FOLDER = 'package';
  return {
    src: tgzName,
    dest: `build/node_modules/${packageName}`,
    tar: {
      entries: [CONTENTS_FOLDER],
      map(header) {
        if (header.name.indexOf(CONTENTS_FOLDER + '/') === 0) {
          header.name = header.name.substring(CONTENTS_FOLDER.length + 1);
        }
      },
    },
  };
}

async function prepareNpmPackage(name) {
  await Promise.all([
    // fs.copy('LICENSE', `build/node_modules/${name}/LICENSE`),
    fs.copy(
      `packages/${name}/package.json`,
      `build/node_modules/${name}/package.json`
    ),
    fs.copy(
      `packages/${name}/README.md`,
      `build/node_modules/${name}/README.md`
    ),
    fs.copy(`packages/${name}/npm`, `build/node_modules/${name}`),
  ]);

  const path = `build/node_modules/${name}/package.json`;
  const json = await fs.readJson(path);

  // Remove any local path references, they should not be used when
  // publishing packages to the public registry.
  if (json.dependencies) {
    Object.keys(json.dependencies).forEach(dependency => {
      const dependencyVersion = json.dependencies[dependency];
      if (
        dependencyVersion.startsWith(FILE_PROTOCOL_PREFIX) ||
        dependencyVersion.startsWith(LINK_PROTOCOL_PREFIX))
      {
        delete json.dependencies[dependency];
      }
    });
  }

  await fs.writeJson(path, json, {spaces: 2});

  const tgzName = (await asyncExecuteCommand(
    `npm pack build/node_modules/${name}`
  )).trim();
  await fs.remove(`build/node_modules/${name}`);
  await asyncExtractTar(getTarOptions(tgzName, name));
  await fs.unlink(tgzName);
}

async function prepareNpmPackages() {
  if (!fs.existsSync('build/node_modules')) {
    // We didn't build any npm packages.
    return;
  }
  const builtPackageFolders = fs.readdirSync('build/node_modules').filter(
    dir => dir.charAt(0) !== '.'
  );
  await Promise.all(builtPackageFolders.map(prepareNpmPackage));
}

module.exports = {
  getPackageName,
  getBundleOutputPaths,
  prepareNpmPackages,
};
