#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const figlet = require('figlet');
const {paramDefinitions} = require('../config');

module.exports = () => {
  const params = commandLineArgs(paramDefinitions, {
    argv: JSON.parse(process.env.npm_config_argv).original,
    camelCase: true,
    partial: true,
  });

  if (!params.version || params.help) {
    const usage = commandLineUsage([
      {
        content: chalk
          .hex('#A1F295')
          .bold(figlet.textSync(' Chameleon', {font: 'Stampatello'}))
          .replace(/\n.*\n.*$(?![\r\n])/gm, ''),
        raw: true,
      },
      {
        content: 'Automated pre-release build script.',
      },
      {
        header: 'Options',
        optionList: paramDefinitions,
      },
      {
        header: 'Examples',
        content: [
          {
            desc: '1. A concise example.',
            example: '$ yarn release {bold -v} {underline 3.0.0}',
          },
          {
            desc: '2. Dry run build a release candidate (no git commits).',
            example:
              '$ yarn release {bold --dry} {bold -v} {underline 3.0.0-rc.0}',
          },
          {
            desc: '3. Release from another checkout.',
            example:
              '$ yarn release {bold --version} {underline 3.0.0} {bold --path} /path/to/chameleon/repo',
          },
        ],
      },
    ]);
    console.log(usage);
    process.exit();
  }

  return {
    ...params,
    cwd: params.path, // For script convenience
  };
};
