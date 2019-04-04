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
      const cookiesRaw = [];
      const urlRaw = 'https://app.wire.com/';
      await CookieManager.set(cookiesRaw, urlRaw, tempSession);
    });
  });
});
