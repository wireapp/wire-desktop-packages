/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import * as assert from 'assert';
import * as path from 'path';
import {Sandbox} from './Sandbox';

const TEST_DIR = path.join(__dirname, '..', '.test');

describe('Sandbox', () => {
  it('can be run properly', async () => {
    const sandbox = new Sandbox('sandbox-sample.js', TEST_DIR);
    assert.strictEqual(await sandbox.run({}, {}), true);
  });

  it('can properly pass a constant to a sandbox instance', async () => {
    const sampleConstant = Math.random();
    const sandbox = new Sandbox('sandbox-sample-constant.js', TEST_DIR);
    assert.strictEqual(await sandbox.run({sampleConstant}, {}), sampleConstant);
  });

  it('fails when the file does not exist', async () => {
    const sandbox = new Sandbox(Math.random().toString(), TEST_DIR);
    // tslint:disable-next-line
    assert.rejects(sandbox.run({}, {}), {
      message: 'Unable to read file to execute',
      name: 'SandboxError',
    });
  });

  it('can properly detect when a sandbox throws an error via callback', async () => {
    const sandbox = new Sandbox('sandbox-error-callback.js', TEST_DIR);
    // tslint:disable-next-line
    assert.rejects(sandbox.run({}, {}), {
      message: 'An error happened inside the VM (via callback)',
      name: 'InternalSandboxError',
    });
  });

  it('can properly detect when a sandbox throws an error', async () => {
    const sandbox = new Sandbox('sandbox-error-fatal.js', TEST_DIR);
    // tslint:disable-next-line
    assert.rejects(sandbox.run({}, {}), {
      message: 'An error happened inside the VM',
      name: 'SandboxError',
    });
  });
});
