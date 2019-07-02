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

const {Sandbox} = require('../../../dist/commonjs/Sandbox');

describe('Sandbox', () => {
  it('can be run properly', async () => {
    const sandbox = new Sandbox('sample.js', __dirname);
    expect(await sandbox.run()).toBe(true);
  });

  it('can properly pass a constant to a sandbox', async () => {
    const sampleConstant = Math.random();
    const sandbox = new Sandbox('sample-constant.js', __dirname);

    expect(
      await sandbox.run({
        sampleConstant,
      }),
      sampleConstant,
    );
  });
});
