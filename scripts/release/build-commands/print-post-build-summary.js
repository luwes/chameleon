#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {getUnexecutedCommands} = require('../utils');

const CHANGELOG_PATH =
  'https://github.com/luwes/chameleon/edit/master/CHANGELOG.md';

module.exports = ({cwd, dry, path, version}) => {
  const command =
    `yarn push-release` +
    (path ? ` -p ${path}` : '') +
    (dry ? ' --dry' : '');

  console.log(
    chalk`
    {green.bold Build successful!}
    ${getUnexecutedCommands()}
    Next there are a couple of manual steps:

    {bold.underline Step 1: Update the CHANGELOG}

    Here are a few things to keep in mind:
    • The changes should be easy to understand. (Friendly one-liners are better than PR titles.)
    • Make sure all contributors are credited.
    • Verify that the markup is valid by previewing it in the editor:
    {blue.bold ${CHANGELOG_PATH}}

    After completing the above steps, resume the release process by running:
    {yellow.bold ${command}}
  `.replace(/\n +/g, '\n')
  );
};
