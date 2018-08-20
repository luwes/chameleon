'use strict';

const fs = require('fs-extra');
const path = require('path');
const exec = require('child_process').exec;
const targz = require('targz');
const {promisify} = require('util');

function asyncExecuteCommand(command) {
  return new Promise((resolve, reject) =>
    exec(command, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    })
  );
}

function asyncExtractTar(options) {
  return new Promise((resolve, reject) =>
    targz.decompress(options, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    })
  );
}

function resolvePath(filepath) {
  if (filepath[0] === '~') {
    return path.join(process.env.HOME, filepath.slice(1));
  } else {
    return path.resolve(filepath);
  }
}

function readFileAsync(file, options) {
  const readFile = promisify(fs.readFile);
  return readFile(file, options);
}

module.exports = {
  resolvePath,
  asyncExecuteCommand,
  asyncExtractTar,
  readFileAsync,
};
