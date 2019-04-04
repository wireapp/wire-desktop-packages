const assert = require('assert');
const {CookieManager} = require('../../dist/commonjs/CookieManager');

describe('CookieManager', () => {
  describe('constructor', () => {
    it('has a max cookie length', () => {
      const maxCookieLength = 4096;
      assert.strictEqual(CookieManager.MAX_COOKIE_LENGTH, maxCookieLength);
    });
  });
});
