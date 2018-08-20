'use strict';

const fs = require('fs-extra');
const chalk = require('chalk');
const {exec} = require('child-process-promise');
const argv = require('minimist')(process.argv.slice(2));
const {join} = require('path');

const requestedPackageNames = (argv._[0] || '')
  .split(',')
  .map(type => type.toLowerCase());

async function linkPackages() {
  for (const pkg of requestedPackageNames) {
    await linkPackage(pkg);
  }
}

async function linkPackage(pkg) {
  const cwd = join('packages', pkg);
  await exec(`npm link`, { cwd });
  await fs.remove(`${cwd}/package-lock.json`);

  const logKey = chalk.white.bold(pkg);
  console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}`);
}

async function run() {
    try {
        await linkPackages();
    }
    catch (error) {
        const message = error.message.trim().replace(/\n +/g, '\n');
        const stack = error.stack.replace(error.message, '');

        console.log(
            `${chalk.bgRed.white(' ERROR ')} ${chalk.red(message)}\n\n${chalk.gray(
                stack
            )}`
        );

        process.exit(1);
    }
}

run();
