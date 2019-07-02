/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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
import * as fs from 'fs';
import {Utils, UploadData} from './Utils';
import {session} from 'electron';

describe('Utils', () => {
  describe('fs-related', () => {
    const fileName = `.test.${Math.random()}`;
    const fileContent = 'hello world';
    before(() => fs.writeFileSync(fileName, fileContent));
    after(() => fs.unlinkSync(fileName));

    describe('readFileAsBuffer', () => {
      it('properly reads a file', async () => {
        assert.strictEqual((await Utils.readFileAsBuffer(fileName)).toString('hex'), Buffer.from(fileContent).toString('hex'));
      });

      it('fails when reading a non-existing file', async () => {
        try {
          await Utils.readFileAsBuffer(`/non/existant/path`);
          assert.fail('Expected error not thrown');
        } catch (error) {
          assert.ok(error.message === `ENOENT: no such file or directory, open '/non/existant/path'`);
        }
      });
    });

    describe('readFileAsString', () => {
      it('properly reads a file', async () => {
        assert.strictEqual(await Utils.readFileAsString(fileName), fileContent);
      });
    });
  });

  describe('UploadData', () => {
    describe('getData', () => {
      it('can get the bytes out of the function', async () => {
        const expected = Buffer.from('bytes');
        assert.strictEqual(await UploadData.getData([{bytes: expected, blobUUID: undefined, file: undefined}], session.defaultSession), expected);
      });

      it('can return undefined if no upload data is passed', async () => {
        assert.strictEqual(await UploadData.getData(undefined, session.defaultSession), undefined);
      });
    });
  });

  describe('removeCommitFromVersion', () => {
    it('properly strip the commit tag from a version', () => {
      assert.strictEqual(Utils.removeCommitFromVersion('3.9.0-1f59136'), '3.9.0');
      assert.strictEqual(Utils.removeCommitFromVersion('3.0-1f59136'), '3.0');
      assert.strictEqual(Utils.removeCommitFromVersion('3-1f59136'), '3');
    });
  });
});
