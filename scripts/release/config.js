'use strict';

const dependencies = [];

const paramDefinitions = [
  {
    name: 'dry',
    type: Boolean,
    description: 'Build artifacts but do not commit or publish',
    defaultValue: false,
  },
  {
    name: 'version',
    type: String,
    alias: 'v',
    description: 'Semantic version number',
  },
  {
    name: 'path',
    type: String,
    alias: 'p',
    description:
      'Location of Chameleon repository to release; defaults to {bold cwd}',
    defaultValue: '.',
  },
  {
    name: 'branch',
    type: String,
    alias: 'b',
    description: 'Branch to build from; defaults to the {bold current checked out branch}',
    defaultValue: '',
  },
  {
    name: 'help',
    type: Boolean,
    alias: 'h',
    description: 'Print this usage guide',
  },
  // {
  //   name: 'local',
  //   type: Boolean,
  //   description:
  //     "Don't push or pull changes from remote repo. Don't check CI status.",
  // },
  // {
  //   name: 'tag',
  //   type: String,
  //   description:
  //     'The npm dist tag; defaults to {bold latest} for a stable' +
  //     'release, {bold next} for unstable',
  // },
];

module.exports = {
  dependencies,
  paramDefinitions,
};
