#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const figlet = require('figlet');
let {paramDefinitions} = require('../config');

module.exports = () => {
  paramDefinitions = paramDefinitions.filter((o) => o.name !== 'version');

  const params = commandLineArgs(paramDefinitions, {
    argv: JSON.parse(process.env.npm_config_argv).original,
    camelCase: true,
    partial: true,
  });

  if (params.help) {
    const usage = commandLineUsage([
      {
        content: chalk
          .hex('#A1F295')
          .bold(figlet.textSync(' Chameleon', {font: 'Stampatello'}))
          .replace(/\n.*\n.*$(?![\r\n])/gm, ''),
        raw: true,
      },
      {
        content: 'Automated release publishing script.',
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
            example: '$ yarn push-release',
          },
          {
            desc: '2. Dry run publish.',
            example:
              '$ yarn push-release {bold --dry}',
          },
          {
            desc: '3. Release from another checkout.',
            example:
              '$ yarn push-release {bold --path} /path/to/chameleon/repo',
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
