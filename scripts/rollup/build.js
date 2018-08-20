'use strict';

const fs = require('fs-extra');
const {rollup} = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const stripBanner = require('rollup-plugin-strip-banner');
const uglify = require('rollup-plugin-uglify');
const chalk = require('chalk');
const resolve = require('rollup-plugin-node-resolve');
const argv = require('minimist')(process.argv.slice(2));
const Modules = require('./modules');
const Bundles = require('../bundler/bundles');
const Stats = require('../bundler/stats');
const Packaging = require('./packaging');
const codeFrame = require('babel-code-frame');
const Wrappers = require('../bundler/wrappers');

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
  ES_DEV,
  ES_PROD,
} = Bundles.bundleTypes;

const requestedBundleTypes = (argv.type || '')
  .split(',')
  .map(type => type.toUpperCase());
let requestedBundleNames = (argv._[0] || '')
  .split(',')
  .map(type => type.toLowerCase());
const forcePrettyOutput = argv.pretty;

let watcher;
let cache;
let building = false;
let needsRebuild = false;

function getBabelConfig(updateBabelOptions, bundleType, filename) {
  let options = {
    exclude: '/**/node_modules/**',
    presets: [],
    plugins: [],
  };
  if (updateBabelOptions) {
    options = updateBabelOptions(options);
  }
  switch (bundleType) {
    case ES_DEV:
      return options;
    case ES_PROD:
      return Object.assign({}, options, {
        minified: true,
      });
    default:
      return options;
  }
}

function getRollupOutputOptions(
  outputPath,
  format,
  globals,
  globalName,
  bundleType
) {
  const isProduction = isProductionBundleType(bundleType);

  return Object.assign(
    {},
    {
      file: outputPath,
      format,
      globals,
      freeze: !isProduction,
      interop: false,
      name: globalName,
      sourcemap: false,
    }
  );
}

function getFormat(bundleType) {
  switch (bundleType) {
    case ES_DEV:
    case ES_PROD:
      return `es`;
  }
}

function getFilename(name, globalName, bundleType) {
  // we do this to replace / to -, for react-dom/server
  name = name.replace('/', '-');
  switch (bundleType) {
    case ES_DEV:
      return `${name}.js`;
    case ES_PROD:
      return `${name}.min.js`;
  }
}

function isProductionBundleType(bundleType) {
  switch (bundleType) {
    case ES_DEV:
      return false;
    case ES_PROD:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function getPlugins(
  entry,
  externals,
  updateBabelOptions,
  filename,
  packageName,
  bundleType,
  globalName,
  moduleType,
  modulesToStub
) {
  const isProduction = isProductionBundleType(bundleType);
  // const isInGlobalScope = bundleType === UMD_DEV || bundleType === UMD_PROD;
  const isEsBundleType = bundleType === ES_DEV || bundleType === ES_PROD;
  return [
    // Use Node resolution mechanism.
    resolve(),
    // Remove license headers from individual modules
    stripBanner({
      exclude: 'node_modules/**/*',
    }),
    // Compile to ES5.
    babel(getBabelConfig(updateBabelOptions, bundleType)),
    // Remove 'use strict' from individual source files.
    {
      transform(source) {
        return source.replace(/['"]use strict['"']/g, '');
      },
    },
    // Turn __DEV__ and process.env checks into constants.
    replace({
      '__DEBUG__': !isProduction,
      '__DEV__': !isProduction,
      'process.env.NODE_ENV': isProduction ? "'production'" : "'development'",
    }),
    // We still need CommonJS for external deps like object-assign.
    commonjs(),
    // Apply dead code elimination and/or minification.
    isProduction && !isEsBundleType &&
      uglify({
          compress: {
              pure_getters: true,
              unsafe: true,
              unsafe_comps: true,
              warnings: false,
          },
      }),
    // License and haste headers, top-level `if` blocks.
    {
      transformBundle(source) {
        return Wrappers.wrapBundle(
          source,
          bundleType,
          globalName,
          filename,
          moduleType
        );
      },
    },
  ].filter(Boolean);
}

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

async function createBundle(bundle, bundleType) {
  if (shouldSkipBundle(bundle, bundleType)) {
    return;
  }

  const filename = getFilename(bundle.entry, bundle.global, bundleType);

  const logKey =
    chalk.white.bold(filename) + chalk.dim(` (${bundleType.toLowerCase()})`);
  const format = getFormat(bundleType);
  const packageName = Packaging.getPackageName(bundle.entry);

  let resolvedEntry = require.resolve(`${bundle.entry}`);

  const shouldBundleDependencies = true;
  const peerGlobals = Modules.getPeerGlobals(bundle.externals, bundleType);
  let externals = Object.keys(peerGlobals);
  if (!shouldBundleDependencies) {
    const deps = Modules.getDependencies(bundleType, bundle.entry);
    externals = externals.concat(deps);
  }

  const importSideEffects = Modules.getImportSideEffects();
  const pureExternalModules = Object.keys(importSideEffects).filter(
    module => !importSideEffects[module]
  );

  const rollupConfig = {
    cache,
    input: resolvedEntry,
    treeshake: {
      pureExternalModules,
    },
    external(id) {
      const containsThisModule = pkg => id === pkg || id.startsWith(pkg + '/');
      const isProvidedByDependency = externals.some(containsThisModule);
      if (!shouldBundleDependencies && isProvidedByDependency) {
        return true;
      }
      return !!peerGlobals[id];
    },
    onwarn: handleRollupWarning,
    plugins: getPlugins(
      bundle.entry,
      externals,
      bundle.babel,
      filename,
      packageName,
      bundleType,
      bundle.global,
      bundle.moduleType,
      bundle.modulesToStub
    ),
  };
  const [mainOutputPath, ...otherOutputPaths] = Packaging.getBundleOutputPaths(
    bundleType,
    filename,
    packageName
  );
  const rollupOutputOptions = getRollupOutputOptions(
    mainOutputPath,
    format,
    peerGlobals,
    bundle.global,
    bundleType
  );

  console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
  try {
    const result = await rollup(rollupConfig);
    cache = result;

    if (watcher) {
      const stripNullByteStrings = (id) => id.replace(/\0/g, '');
      const getModuleIds = (module) => stripNullByteStrings(module.id);
      watcher.add(result.modules.map((getModuleIds)));
    }

    const { code } = await result.write(rollupOutputOptions);
    Stats.saveSize(filename, bundleType, packageName, code);
  } catch (error) {
    console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
    handleRollupError(error);
    throw error;
  }
  for (let i = 0; i < otherOutputPaths.length; i++) {
    await fs.copy(mainOutputPath, otherOutputPaths[i]);
  }
  console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
}

function handleRollupWarning(warning) {
  if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
    const match = warning.message.match(/external module '([^']+)'/);
    if (!match || typeof match[1] !== 'string') {
      throw new Error(
        'Could not parse a Rollup warning. Fix this method.'
      );
    }
    const importSideEffects = Modules.getImportSideEffects();
    const externalModule = match[1];
    if (typeof importSideEffects[externalModule] !== 'boolean') {
      throw new Error(
        'An external module "' +
          externalModule +
          '" is used in a DEV-only code path ' +
          'but we do not know if it is safe to omit an unused require() to it in production. ' +
          'Please add it to the `importSideEffects` list in `scripts/rollup/modules.js`.'
      );
    }
    // Don't warn. We will remove side effectless require() in a later pass.
    return;
  }

  if (typeof warning.code === 'string') {
    // This is a warning coming from Rollup itself.
    // These tend to be important (e.g. clashes in namespaced exports)
    // so we'll fail the build on any of them.
    console.error();
    console.error(warning.message || warning);
    console.error();
    process.exit(1);
  } else {
    // The warning is from one of the plugins.
    // Maybe it's not important, so just print it.
    console.warn(warning.message || warning);
  }
}

function handleRollupError(error) {
  loggedErrors.add(error);
  if (!error.code) {
    console.error(error);
    return;
  }
  console.error(
    `\x1b[31m-- ${error.code}${error.plugin ? ` (${error.plugin})` : ''} --`
  );
  console.error(error.stack);
  if (error.loc && error.loc.file) {
    const {file, line, column} = error.loc;
    // This looks like an error from Rollup, e.g. missing export.
    // We'll use the accurate line numbers provided by Rollup but
    // use Babel code frame because it looks nicer.
    const rawLines = fs.readFileSync(file, 'utf-8');
    // column + 1 is required due to rollup counting column start position from 0
    // whereas babel-code-frame counts from 1
    const frame = codeFrame(rawLines, line, column + 1, {
      highlightCode: true,
    });
    console.error(frame);
  } else if (error.codeFrame) {
    // This looks like an error from a plugin (e.g. Babel).
    // In this case we'll resort to displaying the provided code frame
    // because we can't be sure the reported location is accurate.
    console.error(error.codeFrame);
  }
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
    await createBundle(bundle, ES_DEV);
    await createBundle(bundle, ES_PROD);
  }

  await Packaging.prepareNpmPackages();

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
