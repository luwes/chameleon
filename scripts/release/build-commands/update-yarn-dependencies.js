#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {dependencies} = require('../config');
const {execRead, execUnlessDry, logPromise} = require('../utils');

const update = async ({cwd, dry, version}) => {
  const dependenciesList = dependencies.join(' ').trim();
  if (dependenciesList) {
    await exec(`yarn upgrade ${dependenciesList}`, {cwd});
  }

  const modifiedFiles = await execRead('git ls-files -m', {cwd});

  // If yarn.lock has changed we should commit it.
  // If anything else has changed, it's an error.
  if (modifiedFiles) {
    if (modifiedFiles !== 'yarn.lock') {
      throw Error(
        chalk`
        Unexpected modifications

        {white The following files have been modified unexpectedly:}
        {gray ${modifiedFiles}}
        `
      );
    }

    await execUnlessDry(
      `git commit -am "Updating yarn.lock file for ${version} release"`,
      {cwd, dry}
    );
  }
};

module.exports = async params => {
  return logPromise(update(params), 'Upgrading NPM dependencies');
};
