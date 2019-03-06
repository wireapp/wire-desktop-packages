/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

const distDir = '../../../dist/commonjs';
const {Utils} = require(`${distDir}/Utils`);
const path = require('path');

describe('Utils', () => {
  const testFile = path.join(__dirname, 'fs-read.txt');
  const expectedData = 'hello world';

  it('can read a file as a buffer', async () => {
    const data = await Utils.readFileAsBuffer(testFile);
    expect(Buffer.from(expectedData, 'utf-8').equals(data)).toBe(true);
  });

  it('can read a file as a string', async () => {
    const data = await Utils.readFileAsString(testFile);
    expect(data).toBe(expectedData);
  });

  it('can write a file as buffer', async () => {
    const testWriteFile = path.join(__dirname, 'fs-write.txt');
    await Utils.writeFileAsBuffer(testWriteFile, Buffer.from(expectedData, 'utf-8'));
    expect(await Utils.readFileAsString(testWriteFile)).toBe(expectedData);
    await Utils.deleteFile(testWriteFile);
  });

  it('can identify a valid version of the wrapper', () => {
    expect(Utils.isValidVersion('2.1.1')).toBe(true);
    expect(Utils.isValidVersion('0.0.0')).toBe(true);
    expect(Utils.isValidVersion('1.2.9')).toBe(true);
    expect(Utils.isValidVersion('1.6.89')).toBe(true);
    expect(Utils.isValidVersion('1.6.899')).toBe(true);

    expect(Utils.isValidVersion('1689')).toBe(false);
    expect(Utils.isValidVersion('1.689')).toBe(false);
    expect(Utils.isValidVersion('2.1')).toBe(false);
    expect(Utils.isValidVersion('2')).toBe(false);
    expect(Utils.isValidVersion('2,1')).toBe(false);
    expect(Utils.isValidVersion('aaaaaa')).toBe(false);
    expect(Utils.isValidVersion('0.0')).toBe(false);
    expect(Utils.isValidVersion('0')).toBe(false);
    expect(Utils.isValidVersion('000000.000000.000000')).toBe(false);
  });

  it('can parse a valid version of the webapp', () => {
    let test;

    test = Utils.parseWebappVersion('2018-04-12-13-37-prod');
    expect(test.buildDate.isValid).toBe(true);
    expect(test.environment).toBe('prod');

    test = Utils.parseWebappVersion('2018-04-12-13-37-');
    expect(test.buildDate.isValid).toBe(true);
    expect(test.environment).toBe('');

    test = Utils.parseWebappVersion('2018-04-12-13-37-staging');
    expect(test.buildDate.isValid).toBe(true);
    expect(test.environment).toBe('staging');

    test = Utils.parseWebappVersion('2018-04-12-13-37-dev');
    expect(test.buildDate.isValid).toBe(true);
    expect(test.environment).toBe('dev');
  });

  it('cannot parse invalid version of the webapp', () => {
    let test;

    test = Utils.parseWebappVersion('1.2.3-prod');
    expect(test.buildDate.isValid).toBe(false);
    expect(test.environment).toBe('prod');

    test = Utils.parseWebappVersion('-0-04-12-13-37');
    expect(test.buildDate.isValid).toBe(false);
    expect(test.environment).toBe('');
  });
});
