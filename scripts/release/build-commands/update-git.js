#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {logPromise, execRead} = require('../utils');

const getBranch = ({cwd, branch}) => {
  return branch || execRead(`git rev-parse --abbrev-ref HEAD`, {cwd});
};

const update = async ({cwd, branch, local}) => {
  if (!local) {
    await exec('git fetch', {cwd});
  }
  await exec(`git checkout ${branch}`, {cwd});
  if (!local) {
    await exec('git pull', {cwd});
  }
};

module.exports = async params => {
  const branch = await getBranch(params);
  return logPromise(
    update(params),
    `Updating checkout ${chalk.yellow.bold(
      params.cwd
    )} on branch ${chalk.yellow.bold(branch)}}`
  );
};
