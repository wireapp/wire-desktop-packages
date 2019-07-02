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
import * as fs from 'fs-extra';
import * as path from 'path';
import {Utils} from './Utils';

describe('Utils', () => {
  /*
  describe('displayNotification', () => {
    it('works under normal conditions', async (done) => {
      const callback = (name: string, event: Event) => done();

      (await Utils.displayNotification({
        title: 'Mocha!',
        body: 'Testing Electron notifications'
      }, callback)).emit('click');
    })
  });
  */

  const rootDir = path.join(__dirname, '..', '.test');

  const testFile = path.join(rootDir, 'fs-read.txt');
  const testFileFakeAsar = path.join(rootDir, 'fs-read.asar');
  const expectedData = 'hello world';

  it('can read a file as a buffer', async () => {
    const data = await Utils.readFileAsBuffer(testFile);
    assert.deepStrictEqual(Buffer.from(expectedData, 'utf-8'), data);
  });

  it('can read a file as a buffer without asar support', async () => {
    const data = await Utils.readFileAsBuffer(testFileFakeAsar, true);
    assert.deepStrictEqual(Buffer.from(expectedData, 'utf-8'), data);
  });

  it('can read a file as a string', async () => {
    const data = await Utils.readFileAsString(testFile);
    assert.strictEqual(data, expectedData);
  });

  it('can read a file as a string without asar support', async () => {
    const data = await Utils.readFileAsString(testFileFakeAsar, true);
    assert.strictEqual(data, expectedData);
  });

  it('can write a file as buffer', async () => {
    const testWriteFile = path.join(rootDir, 'fs-write.txt');
    await Utils.writeFileAsBuffer(testWriteFile, Buffer.from(expectedData, 'utf-8'));
    assert.strictEqual(await Utils.readFileAsString(testWriteFile), expectedData);
    await Utils.deleteFile(testWriteFile);
  });

  it('can identify a valid version of the wrapper', () => {
    assert.strictEqual(Utils.isValidVersion('2.1.1'), true);
    assert.strictEqual(Utils.isValidVersion('0.0.0'), true);
    assert.strictEqual(Utils.isValidVersion('1.2.9'), true);
    assert.strictEqual(Utils.isValidVersion('1.6.89'), true);
    assert.strictEqual(Utils.isValidVersion('1.6.899'), true);
    assert.strictEqual(Utils.isValidVersion('1.689'), true);
    assert.strictEqual(Utils.isValidVersion('2.1'), true);
    assert.strictEqual(Utils.isValidVersion('0.0'), true);

    assert.strictEqual(Utils.isValidVersion('1689'), false);
    assert.strictEqual(Utils.isValidVersion('2'), false);
    assert.strictEqual(Utils.isValidVersion('2,1'), false);
    assert.strictEqual(Utils.isValidVersion('aaaaaa'), false);
    assert.strictEqual(Utils.isValidVersion('0'), false);
    assert.strictEqual(Utils.isValidVersion('000000.000000.000000'), false);
    assert.strictEqual(Utils.isValidVersion(''), false);
  });

  describe('parseWebappVersion', () => {
    it('can parse a valid version of the webapp', () => {
      let test;

      test = Utils.parseWebappVersion('2018-04-12-13-37-prod');
      assert.strictEqual(test.buildDate.isValid, true);
      assert.strictEqual(test.environment, 'prod');

      test = Utils.parseWebappVersion('2018-04-12-13-37-');
      assert.strictEqual(test.buildDate.isValid, true);
      assert.strictEqual(test.environment, '');

      test = Utils.parseWebappVersion('2018-04-12-13-37-staging');
      assert.strictEqual(test.buildDate.isValid, true);
      assert.strictEqual(test.environment, 'staging');

      test = Utils.parseWebappVersion('2018-04-12-13-37-dev');
      assert.strictEqual(test.buildDate.isValid, true);
      assert.strictEqual(test.environment, 'dev');
    });

    it('cannot parse invalid version of the webapp', () => {
      let test;

      test = Utils.parseWebappVersion('1.2.3-prod');
      assert.strictEqual(test.buildDate.isValid, false);
      assert.strictEqual(test.environment, 'prod');

      test = Utils.parseWebappVersion('-0-04-12-13-37');
      assert.strictEqual(test.buildDate.isValid, false);
      assert.strictEqual(test.environment, '');
    });
  });

  describe('ensureUpdaterFolderExists', () => {
    it('ensure that the update folder exist', async () => {
      await Utils.ensureUpdaterFolderExists();
    });
  });

  describe('compareClientVersion', () => {
    it('can compare version properly', async () => {
      assert.strictEqual(await Utils.compareClientVersion('3.7', '3.8'), -1);
      assert.strictEqual(await Utils.compareClientVersion('3.8', '3.7'), 1);
      assert.strictEqual(await Utils.compareClientVersion('3.8', '3.8'), 0);
    });
  });

  describe('getFilenameFromChecksum', () => {
    it('can get a valid filename out of a checksum', async () => {
      const publicKey = 'ffbab1f0d42ef879c589dd2b85437875b63b9f706ffaa8926fccfb5b8e9abc53';
      assert.strictEqual(
        await Utils.getFilenameFromChecksum(Buffer.from(publicKey, 'hex')),
        'ffbab1f0d42ef879c589dd2b85437875.asar'
      );
    });
  });

  describe('getDocumentRoot', () => {
    it('can get the document root', async () => {
      const publicKey = Buffer.from('ffbab1f0d42ef879c589dd2b85437875b63b9f706ffaa8926fccfb5b8e9abc53', 'hex');
      const checksumFolderPath = Utils.resolvePath(Utils.getFilenameFromChecksum(publicKey));
      await fs.ensureDir(checksumFolderPath);
      assert.strictEqual(await Utils.getDocumentRoot(publicKey), checksumFolderPath);
      await fs.remove(checksumFolderPath);
    });

    it('fails when the document root does not exist', () => {
      const publicKey = Buffer.from('aabaf1f1d42ef879c589dd2b85437875b63b9f706ffaa8926fccfb5b8e9abc53', 'hex');
      assert.rejects(
        // tslint:disable-next-line
        Utils.getDocumentRoot(publicKey), {
          message: 'Document root does not exist',
          name: 'Error',
        }
      );
    });
  });

  describe('openExternalLink', () => {
    it('can open external links', async () => {
      await Utils.openExternalLink('https://wire.com');
    });

    it('can open non-secure links if secure param is false', async () => {
      await Utils.openExternalLink('http://wire.com', false);
    });

    it('does not open external links other than https if secure param is true', () => {
      // tslint:disable-next-line
      assert.rejects(Utils.openExternalLink('http://wire.com'), {
        message: 'Denied to open external URL',
        name: 'Error',
      });
    });
  });
});
