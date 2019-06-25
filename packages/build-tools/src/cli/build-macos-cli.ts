#!/usr/bin/env node

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

import commander from 'commander';
import {flatAsync as buildPkg} from 'electron-osx-sign';
import electronPackager from 'electron-packager';
import * as fs from 'fs-extra';
import * as path from 'path';

import {checkCommanderOptions, getLogger, getToolName, manualMacOSSign, writeJson} from '../lib/build-utils';
import {getCommonConfig, logEntries} from '../lib/commonConfig';
import {MacOSConfig} from '../lib/Config';

const toolName = getToolName(__filename);
const logger = getLogger(toolName);

commander
  .name(toolName)
  .description('Build the Wire wrapper for macOS')
  .option('-w, --wire-json <path>', 'Specify the wire.json path')
  .option('-m, --manual-sign', 'Manually sign and package the app')
  .parse(process.argv);

checkCommanderOptions(commander, ['wireJson']);

const wireJsonResolved = path.resolve(commander.wireJson);
const {commonConfig, defaultConfig} = getCommonConfig({envFile: '.env.defaults', wireJson: wireJsonResolved});
const packageJson = path.resolve('package.json');
const originalPackageJson = fs.readJsonSync(packageJson);

const macOsDefaultConfig: MacOSConfig = {
  bundleId: 'com.wearezeta.zclient.mac',
  category: 'public.app-category.social-networking',
  certNameApplication: null,
  certNameInstaller: null,
  notarizeAppleId: null,
  notarizeApplePassword: null,
};

const macOSConfig: MacOSConfig = {
  ...macOsDefaultConfig,
  bundleId: process.env.MACOS_BUNDLE_ID || macOsDefaultConfig.bundleId,
  certNameApplication: process.env.MACOS_CERTIFICATE_NAME_APPLICATION || macOsDefaultConfig.certNameApplication,
  certNameInstaller: process.env.MACOS_CERTIFICATE_NAME_INSTALLER || macOsDefaultConfig.certNameInstaller,
  notarizeAppleId: process.env.MACOS_NOTARIZE_APPLE_ID || macOsDefaultConfig.notarizeAppleId,
  notarizeApplePassword: process.env.MACOS_NOTARIZE_APPLE_PASSWORD || macOsDefaultConfig.notarizeApplePassword,
};

const packagerOptions: electronPackager.Options = {
  appBundleId: macOSConfig.bundleId,
  appCategoryType: 'public.app-category.social-networking',
  appCopyright: commonConfig.copyright,
  appVersion: commonConfig.version,
  asar: true,
  buildVersion: commonConfig.buildNumber,
  darwinDarkModeSupport: true,
  dir: '.',
  extendInfo: 'resources/macos/custom.plist',
  helperBundleId: `${macOSConfig.bundleId}.helper`,
  icon: 'resources/macos/logo.icns',
  ignore: /electron\/renderer\/src/,
  name: commonConfig.name,
  out: 'wrap/build',
  overwrite: true,
  platform: 'mas',
  protocols: [{name: `${commonConfig.name} Core Protocol`, schemes: [commonConfig.customProtocolName]}],
  quiet: false,
};

if (!commander.manualSign) {
  if (macOSConfig.certNameApplication) {
    packagerOptions.osxSign = {
      entitlements: 'resources/macos/entitlements/parent.plist',
      'entitlements-inherit': 'resources/macos/entitlements/child.plist',
      identity: macOSConfig.certNameApplication,
    };
  }

  if (macOSConfig.notarizeAppleId && macOSConfig.notarizeApplePassword) {
    packagerOptions.osxNotarize = {
      appleId: macOSConfig.notarizeAppleId,
      appleIdPassword: macOSConfig.notarizeApplePassword,
    };
  }
}

logEntries(commonConfig, 'commonConfig', toolName);
logEntries(macOSConfig, 'macOSConfig', toolName);

logger.info(`Building ${commonConfig.name} ${commonConfig.version} for macOS ...`);

writeJson(packageJson, {...originalPackageJson, productName: commonConfig.name, version: commonConfig.version})
  .then(() => writeJson(wireJsonResolved, commonConfig))
  .then(() => electronPackager(packagerOptions))
  .then(([buildDir]) => {
    logger.log(`Built app in "${buildDir}".`);

    if (macOSConfig.certNameInstaller) {
      const appFile = path.join(buildDir, `${commonConfig.name}.app`);
      const pkgFile = path.join(packagerOptions.out!, `${commonConfig.name}.pkg`);

      if (commander.manualSign) {
        return manualMacOSSign(appFile, pkgFile, commonConfig, macOSConfig, logger);
      }

      return buildPkg({
        app: appFile,
        identity: macOSConfig.certNameInstaller,
        pkg: pkgFile,
        platform: 'mas',
      });
    }

    return;
  })
  .then(() => {
    if (macOSConfig.certNameInstaller) {
      logger.log(`Built installer in "${packagerOptions.out}".`);
    }
  })
  .finally(() => Promise.all([writeJson(wireJsonResolved, defaultConfig), writeJson(packageJson, originalPackageJson)]))
  .catch(error => {
    logger.error(error);
    process.exit(1);
  });
