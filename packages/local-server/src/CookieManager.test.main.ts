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
import {session} from 'electron';
import UUID from 'pure-uuid';
import {CookieManager} from './CookieManager';

describe('CookieManager', () => {
  let ephemeralSession: Electron.Session;
  beforeEach(() => {
    ephemeralSession = session.fromPartition(new UUID(4).format());
  });

  describe('get', () => {
    it('returns undefined when getting an non-existant cookie', async () => {
      const urlRaw = 'https://aws.amazon.com/';
      assert.strictEqual(await CookieManager.get(urlRaw, ephemeralSession), undefined);
    });
  });

  describe('set', () => {
    it('sets a cookie', async () => {
      const cookiesRaw = [
        'aws-priv=eyJ2IjoxLCJldSI6MSwic3QiOjB9; Version=1; Comment="Anonymous cookie for privacy regulations"; Domain=.amazon.com; Max-Age=94672800; Expires=Tue, 05-Apr-2022 02:50:31 GMT; Path=/',
        'aws_lang=en; Domain=.amazon.com; Path=/',
      ];
      const urlRaw = 'https://aws.amazon.com/';
      await CookieManager.set(cookiesRaw, urlRaw, ephemeralSession);
      assert.strictEqual(
        await CookieManager.get(urlRaw, ephemeralSession),
        'aws-priv=eyJ2IjoxLCJldSI6MSwic3QiOjB9; aws_lang=en; ',
      );
    });

    it('respect the secure flag of a cookie', async () => {
      const cookiesRaw = ['aws_lang=en; Domain=.amazon.com; Path=/; secure'];
      const url = 'https://aws.amazon.com/';
      await CookieManager.set(cookiesRaw, url, ephemeralSession);
      assert.strictEqual(await CookieManager.get(url, ephemeralSession), 'aws_lang=en; ');
      const urlNotSecure = 'http://aws.amazon.com/';
      assert.strictEqual(await CookieManager.get(urlNotSecure, ephemeralSession), undefined);
    });

    it('sets the root as the default path flag for a cookie', async () => {
      const cookiesRaw = ['aws_lang=en; Domain=.amazon.com;'];
      const url = 'https://aws.amazon.com/';
      await CookieManager.set(cookiesRaw, url, ephemeralSession);
      assert.strictEqual((await ephemeralSession.cookies.get({url}))[0].path, '/');
    });

    it('sets the httpOnly flag for a cookie', async () => {
      const cookiesRaw = ['aws_lang=en; Domain=.amazon.com; HttpOnly'];
      const url = 'https://aws.amazon.com/';
      await CookieManager.set(cookiesRaw, url, ephemeralSession);
      assert.strictEqual((await ephemeralSession.cookies.get({url}))[0].httpOnly, true);
    });

    it('throws an error when the cookie does not have a name', async () => {
      const cookiesRaw = ['=en; Domain=.amazon.com; Path=/'];
      const urlRaw = 'https://aws.amazon.com/';
      try {
        await CookieManager.set(cookiesRaw, urlRaw, ephemeralSession);
        assert.fail('Expected error not thrown');
      } catch (error) {
        assert.ok(error.message === 'Cookie name and value must be set');
      }
    });

    it('throws an error when the cookie does not have a value', async () => {
      const cookiesRaw = ['aws_lang=; Domain=.amazon.com; Path=/'];
      const urlRaw = 'https://aws.amazon.com/';
      try {
        await CookieManager.set(cookiesRaw, urlRaw, ephemeralSession);
        assert.fail('Expected error not thrown');
      } catch (error) {
        assert.ok(error.message === 'Cookie name and value must be set');
      }
    });

    it('throws an error when the maximum allowed bytes for a cookie is exceeded', async () => {
      const cookiesRaw = [`aws_lang=${'a'.repeat(5000)}; Domain=.amazon.com; Path=/`];
      const urlRaw = 'https://aws.amazon.com/';
      try {
        await CookieManager.set(cookiesRaw, urlRaw, ephemeralSession);
        assert.fail('Expected error not thrown');
      } catch (error) {
        assert.ok(error.message === 'Maximum bytes for a cookie exceeded');
      }
    });

    it('returns undefined when setting an empty cookie', async () => {
      const cookiesRaw = [];
      const urlRaw = 'https://aws.amazon.com/';
      await CookieManager.set(cookiesRaw, urlRaw, ephemeralSession);
      assert.strictEqual(await CookieManager.get(urlRaw, ephemeralSession), undefined);
    });
  });
});
