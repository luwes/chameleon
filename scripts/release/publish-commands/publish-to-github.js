#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const chalk = require('chalk');
const {readJson} = require('fs-extra');
const {join} = require('path');
// const semver = require('semver');
const {execUnlessDry, logPromise} = require('../utils');

const push = async ({cwd, dry, otp, packages, version, tag}) => {
  const errors = [];
  // const isPrerelease = semver.prerelease(version);
  // if (tag === undefined) {
  //   // No tag was provided. Default to `latest` for stable releases and `next`
  //   // for prereleases
  //   tag = isPrerelease ? 'next' : 'latest';
  // } else if (tag === 'latest' && isPrerelease) {
  //   throw new Error('The tag `latest` can only be used for stable versions.');
  // }

  const publishProject = async project => {
    try {
      const path = join(cwd, 'build', 'node_modules', project);
      const packagePath = join(path, 'package.json');
      const packageJSON = await readJson(packagePath);
      // const packageVersion = packageJSON.version;
      const repo = packageJSON.repository;
      const name = packageJSON.name;
      const gitTagName = `${name}-v${version}`;

      await fs.remove(`build/node_modules/${project}/.git`);

      if (!dry) {
        // let remoteVersion;
        // try {
        //   remoteVersion = await execRead(`git describe origin/master --match="v*"`);

        //   // Compare remote version to package.json version,
        //   // To better handle the case of pre-release versions.
        //   if (remoteVersion !== packageVersion) {
        //     throw Error(
        //       chalk`Published version {yellow.bold ${packageVersion}} for ` +
        //         chalk`{bold ${project}} but remote shows {yellow.bold ${remoteVersion}}`
        //     );
        //   }
        // } catch (e) {
        //   if (e.code === 128) {
        //     console.log(`Releasing first tag ${version}`);
        //   } else {
        //     throw e;
        //   }
        // }

        await execUnlessDry(`git init`, {cwd: path, dry});
        await execUnlessDry(`git add .`, {cwd: path, dry});
        await execUnlessDry(`git commit -m "Add release ${gitTagName}"`, {cwd: path, dry});
        await execUnlessDry(`git remote add origin ${repo}`, {cwd: path, dry});
        await execUnlessDry(`git tag -a ${gitTagName} -m "Tagging ${gitTagName} release"`, {cwd: path, dry});

        try {
          await execUnlessDry(`git push origin ${gitTagName}`, {cwd: path, dry});
        } catch (error) {
          const gitErrorExists = 'Updates were rejected because the tag already exists in the remote.';
          const exists = error.stderr.indexOf(gitErrorExists) > -1;
          if (exists) {
            throw new Error(`The git tag "${gitTagName}" already exists in "${repo}".`);
          }

          throw error;
        }

        // If we've just published a stable release,
        // Update the @next tag to also point to it (so @next doesn't lag behind).
        // if (!isPrerelease) {
        //   await execUnlessDry(
        //     `npm dist-tag add ${project}@${packageVersion} next`,
        //     {cwd: path: path, dry}
        //   );
        // }
      }
    } catch (error) {
      errors.push(error.stack);
    }
  };

  await Promise.all(packages.map(publishProject));

  if (errors.length > 0) {
    throw Error(
      chalk`
      Failure publishing to Github

      {white ${errors.join('\n\n')}}`
    );
  }
};

module.exports = async params => {
  return logPromise(push(params), 'Publishing packages to Github');
};
