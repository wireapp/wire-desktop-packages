import * as assert from 'assert';
import {session} from 'electron';
import UUID from 'pure-uuid';
import {CookieManager} from './CookieManager';

describe('CookieManager', () => {
  describe('constructor', () => {
    it('has a max cookie length', () => {
      const maxCookieLength = 4096;
      assert.strictEqual(CookieManager['MAX_COOKIE_LENGTH'], maxCookieLength);
    });
  });

  describe('set', () => {
    it('sets a cookie', async () => {
      const tempSession = session.fromPartition(new UUID(4).format());
      const cookiesRaw = [
        'aws-priv=eyJ2IjoxLCJldSI6MSwic3QiOjB9; Version=1; Comment="Anonymous cookie for privacy regulations"; Domain=.amazon.com; Max-Age=94672800; Expires=Tue, 05-Apr-2022 02:50:31 GMT; Path=/',
        'aws_lang=en; Domain=.amazon.com; Path=/',
      ];
      const urlRaw = 'https://aws.amazon.com/';
      await CookieManager.set(cookiesRaw, urlRaw, tempSession);
      assert.strictEqual(
        await CookieManager.get(urlRaw, tempSession),
        'aws-priv=eyJ2IjoxLCJldSI6MSwic3QiOjB9; aws_lang=en; '
      );
    });
  });
});
