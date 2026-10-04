import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Root of this repository, which is the package under test
 */
export const PACKAGE_ROOT = path.resolve(__dirname, '../..');

/**
 * Fail early, and say why, when the package has not been built
 */
export const assertBuilt = () => {
  if (!fs.existsSync(path.join(PACKAGE_ROOT, 'dist/js/bootstrap-sheet.esm.js'))) {
    throw new Error('dist/ is missing: run `npm run build` before `npm run test:artifacts`.');
  }
};

/**
 * Run code in a separate Node process from a directory
 * @param {string} cwd - Directory to run in
 * @param {'module' | 'commonjs'} inputType - Module system the code is written for
 * @param {string} source - Code that prints one JSON value
 * @returns {unknown} The printed value
 */
export const runNode = (cwd, inputType, source) =>
  JSON.parse(
    execFileSync(process.execPath, [`--input-type=${inputType}`, '--eval', source], {
      cwd,
      encoding: 'utf8',
    }),
  );

/**
 * Create a project that depends on the package the way an installed
 * dependency does: through node_modules/bootstrap-sheet, here a link to this
 * repository
 * @returns {{ dir: string, cleanup: () => void }} The project directory and a
 * function removing it
 */
export const createConsumer = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bootstrap-sheet-consumer-'));
  const link = path.join(dir, 'node_modules', 'bootstrap-sheet');

  fs.mkdirSync(path.dirname(link));

  // A junction needs no privileges on Windows; elsewhere this is a symlink
  fs.symlinkSync(PACKAGE_ROOT, link, 'junction');

  return {
    dir,
    cleanup: () => {
      // Remove the link itself before the directory, so that nothing can
      // ever descend into the repository it points to
      fs.unlinkSync(link);
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
};
