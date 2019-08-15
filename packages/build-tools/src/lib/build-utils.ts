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
 */

import {exec} from 'child_process';
import commander from 'commander';
import * as fs from 'fs-extra';
import logdown from 'logdown';
import * as path from 'path';
import {promisify} from 'util';

import {CommonConfig, MacOSConfig} from './Config';

export function checkCommanderOptions(commanderInstance: typeof commander, options: string[]): void {
  options.forEach(option => {
    if (!commanderInstance.hasOwnProperty(option)) {
      console.error(`Environment variable "${option}" is not set.`);
      commanderInstance.outputHelp();
      process.exit(1);
    }
  });
}

export function getLogger(postfix: string): logdown.Logger {
  const logger = logdown(`@wireapp/build-tools/${postfix}`, {
    logger: console,
    markdown: false,
  });
  logger.state.isEnabled = true;

  return logger;
}

export function getToolName(fullFilename: string): string {
  const fileName = path.basename(fullFilename).replace(/-cli.[tj]s/, '');
  return `wire-${fileName}`;
}

export async function writeJson<T extends Object>(fileName: string, data: T): Promise<void> {
  await fs.writeFile(fileName, `${JSON.stringify(data, null, 2)}\n`);
}

export async function manualMacOSSign(
  appFile: string,
  pkgFile: string,
  commonConfig: CommonConfig,
  macOSConfig: MacOSConfig,
  logger: logdown.Logger,
): Promise<void> {
  async function execAsync(command): Promise<void> {
    const {stderr, stdout} = await promisify(exec)(command);
    if (stderr) {
      logger.error(stderr);
    }
    if (stdout) {
      logger.info(stdout);
    }
  }

  const inheritEntitlements = 'resources/macos/entitlements/child.plist';
  const mainEntitlements = 'resources/macos/entitlements/parent.plist';

  if (macOSConfig.certNameApplication) {
    const filesToSign = [
      '/Frameworks/Electron Framework.framework/Versions/A/Electron Framework',
      '/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib',
      '/Frameworks/Electron Framework.framework/',
      `/Frameworks/${commonConfig.name} Helper.app/Contents/MacOS/${commonConfig.name} Helper`,
      `/Frameworks/${commonConfig.name} Helper.app/`,
      `/Library/LoginItems/${commonConfig.name} Login Helper.app/Contents/MacOS/${commonConfig.name} Login Helper`,
      `/Library/LoginItems/${commonConfig.name} Login Helper.app/`,
    ];

    for (const fileName of filesToSign) {
      const fullPath = `${appFile}/Contents${fileName}`;
      await execAsync(
        `codesign --deep -fs '${macOSConfig.certNameApplication}' --entitlements '${inheritEntitlements}' '${fullPath}'`,
      );
    }

    if (macOSConfig.certNameInstaller) {
      const appExecutable = `${appFile}/Contents/MacOS/${commonConfig.name}`;
      await execAsync(
        `codesign -fs '${macOSConfig.certNameApplication}' --entitlements '${inheritEntitlements}' '${appExecutable}'`,
      );
      await execAsync(
        `codesign -fs '${macOSConfig.certNameApplication}' --entitlements '${mainEntitlements}' '${appFile}'`,
      );
      await execAsync(
        `productbuild --component '${appFile}' /Applications --sign '${macOSConfig.certNameInstaller}' '${pkgFile}'`,
      );
    }
  }
}
