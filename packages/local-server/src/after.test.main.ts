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

import * as fs from 'fs';
import * as path from 'path';

declare var process: NodeJS.Process & {
  type: string;
};

declare global {
  namespace NodeJS {
    interface Global {
      __coverage__: {};
    }
  }
}

const writeCoverageReport = (coverage: Object) => {
  const outputDir = path.resolve(process.cwd(), '.nyc_output');
  const outputFile = path.join(outputDir, `/coverage.${process.type}.json`);
  fs.mkdirSync(outputDir);
  fs.writeFileSync(outputFile, JSON.stringify(coverage));
};

after(() => {
  const coverageInfo = global.__coverage__;
  if (coverageInfo) {
    writeCoverageReport(coverageInfo);
  }
});
