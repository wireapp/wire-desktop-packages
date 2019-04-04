import * as assert from 'assert';
import {CookieManager} from './CookieManager';

describe('CookieManager', () => {
  describe('constructor', () => {
    it('has a max cookie length', () => {
      const maxCookieLength = 4096;
      assert.strictEqual(CookieManager['MAX_COOKIE_LENGTH'], maxCookieLength);
    });
  });
});
