'use strict';

const fs = require('fs-extra');
const {join, dirname} = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
var atImport = require("postcss-import");
const chalk = require('chalk');
const argv = require('minimist')(process.argv.slice(2));
const Bundles = require('../bundler/bundles');
const Stats = require('../bundler/stats');

// Errors in promises should be fatal.
let loggedErrors = new Set();
process.on('unhandledRejection', err => {
  if (loggedErrors.has(err)) {
    // No need to print it twice.
    process.exit(1);
  }
  throw err;
});

const {
  CSS_DEV,
  CSS_PROD,
} = Bundles.bundleTypes;

const requestedBundleTypes = (argv.type || '')
  .split(',')
  .map(type => type.toUpperCase());
let requestedBundleNames = (argv._[0] || '')
  .split(',')
  .map(type => type.toLowerCase());
const forcePrettyOutput = argv.pretty;

let watcher;
let building = false;
let needsRebuild = false;

function shouldSkipBundle(bundle, bundleType) {
  const shouldSkipBundleType = bundle.bundleTypes.indexOf(bundleType) === -1;
  if (shouldSkipBundleType) {
    return true;
  }
  if (requestedBundleTypes.length > 0) {
    const isAskingForDifferentType = requestedBundleTypes.every(
      requestedType => bundleType.indexOf(requestedType) === -1
    );
    if (isAskingForDifferentType) {
      return true;
    }
  }
  if (requestedBundleNames.length > 0) {
    const isAskingForDifferentNames = requestedBundleNames.every(
      requestedName => bundle.label.indexOf(requestedName) === -1
    );
    if (isAskingForDifferentNames) {
      return true;
    }
  }
  return false;
}

function getFilename(name, globalName, bundleType) {
  // we do this to replace / to -, for react-dom/server
  name = name.replace('/', '-');
  switch (bundleType) {
    case CSS_DEV:
      return `${name}.css`;
    case CSS_PROD:
      return `${name}.min.css`;
  }
}

function isProductionBundleType(bundleType) {
  switch (bundleType) {
    case CSS_DEV:
      return false;
    case CSS_PROD:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function getPlugins(entry, filename, bundleType) {
  return [
      atImport,
      autoprefixer,
      isProductionBundleType(bundleType) && cssnano,
  ].filter(Boolean);
}

async function createBundle(bundle, bundleType) {
  if (shouldSkipBundle(bundle, bundleType)) {
    return;
  }

  const filename = getFilename(bundle.entry, bundle.global, bundleType);

  const logKey =
    chalk.white.bold(filename) + chalk.dim(` (${bundleType.toLowerCase()})`);

  let entry = join('packages', bundle.entry, 'src', 'css', 'index.css');
  let output = join('build', 'node_modules', bundle.label, 'css', filename);

  console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
  try {
    const css = await fs.readFile(entry);
    const processor = postcss(getPlugins(entry, filename, bundleType));
    const result = await processor.process(css, { from: entry, to: output });
    await fs.outputFile(output, result.css);
    Stats.saveSize(filename, bundleType, bundle.label, result.css);
    if (result.map) {
      await fs.outputFile(`${output}.map`, result.map);
    }

    if (watcher) {
      watcher.add(dirname(entry));
    }
  } catch (error) {
    console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
    throw error;
  }
  console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
}

async function build() {
  if (building) {
    needsRebuild = true;
    return;
  }

  building = true;
  console.time('Bundled in');

  // Run them serially for better console output
  // and to avoid any potential race conditions.
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const bundle of Bundles.bundles) {
    await createBundle(bundle, CSS_DEV);
    await createBundle(bundle, CSS_PROD);
  }

  console.log(Stats.printResults());
  if (!forcePrettyOutput) {
    Stats.saveResults();
  }

  console.timeEnd('Bundled in');
  building = false;

  if (needsRebuild) {
    needsRebuild = false;
    await build();
  }
}

if (argv.watch) {
    const chokidar = require('chokidar');
    watcher = chokidar.watch(Bundles.bundles.map((b) => `${b.entry}`));
    watcher.on('change', async (path, stats) => {
      requestedBundleNames = path.match(/packages\/([^/]+)/).slice(1);
      await build();
    });

    if (argv.verbose) {
        watcher.on('all', (event, file) => {
            console.log(`chokidar event: ${event} on ${file}`);
        });
    }
}

build();
