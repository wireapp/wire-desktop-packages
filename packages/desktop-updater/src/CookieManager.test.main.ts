import * as assert from 'assert';
import {session} from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import UUID from 'pure-uuid';
import {CookieManager} from './CookieManager';

const writeCoverageReport = (coverage: Object) => {
  const outputFile = path.resolve(process.cwd(), `.nyc_output/coverage.${process.type}.json`);
  fs.outputJsonSync(outputFile, coverage);
};

after(() => {
  const coverageInfo = global['__coverage__'];
  if (coverageInfo) {
    writeCoverageReport(coverageInfo);
  }
});

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
