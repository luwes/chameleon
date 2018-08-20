#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {readJson} = require('fs-extra');
const {join} = require('path');
const logUpdate = require('log-update');
const {getPublicPackages} = require('./utils');

// const checkBuildStatus = require('./publish-commands/check-build-status');
const commitChangelog = require('./publish-commands/commit-changelog');
// const getNpmTwoFactorAuth = require('./publish-commands/get-npm-two-factor-auth');
const parsePublishParams = require('./publish-commands/parse-publish-params');
const printPostPublishSummary = require('./publish-commands/print-post-publish-summary');
const pushGitRemote = require('./publish-commands/push-git-remote');
// const publishToNpm = require('./publish-commands/publish-to-npm');
const publishToGithub = require('./publish-commands/publish-to-github');

// Follows the steps outlined in github.com/facebook/react/issues/10620
const run = async () => {
  const params = parsePublishParams();
  const rootPackage = await readJson(join(params.cwd, 'package.json'));
  params.version = rootPackage.version;
  params.packages = getPublicPackages();

  try {
    // await checkBuildStatus(params);
    await commitChangelog(params);
    await pushGitRemote(params);
    // params.otp = await getNpmTwoFactorAuth(params);
    // await publishToNpm(params);
    await publishToGithub(params);
    await printPostPublishSummary(params);
  } catch (error) {
    logUpdate.clear();

    const message = error.message.trim().replace(/\n +/g, '\n');
    const stack = error.stack.replace(error.message, '');

    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red(message)}\n\n${chalk.gray(
        stack
      )}`
    );

    process.exit(1);
  }
};

run();
