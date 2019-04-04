import * as fs from 'fs-extra';
import * as path from 'path';

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
