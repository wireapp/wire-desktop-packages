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
import * as electronWinstaller from 'electron-winstaller';
import * as path from 'path';

import {checkCommanderOptions, getLogger, getToolName, writeJson} from '../lib/build-utils';
import {getCommonConfig, logEntries} from '../lib/commonConfig';
import {WindowsConfig} from '../lib/Config';

const toolName = getToolName(__filename);
const logger = getLogger(toolName);

commander
  .name(toolName)
  .description('Build the Wire installer for Windows')
  .option('-w, --wire-json <path>', 'Specify the wire.json path')
  .parse(process.argv);

checkCommanderOptions(commander, ['wireJson']);
const wireJsonResolved = path.resolve(commander.wireJson);
const {commonConfig, defaultConfig} = getCommonConfig({envFile: '.env.defaults', wireJson: wireJsonResolved});

const windowsDefaultConfig: WindowsConfig = {
  installerIconUrl: 'https://wire-app.wire.com/win/internal/wire.internal.ico',
  loadingGif: `${commonConfig.electronDirectory}/img/logo.256.png`,
  updateUrl: 'https://wire-app.wire.com/win/internal/',
};

const windowsConfig: WindowsConfig = {
  ...windowsDefaultConfig,
  installerIconUrl: process.env.WIN_URL_ICON_INSTALLER || windowsDefaultConfig.installerIconUrl,
  updateUrl: process.env.WIN_URL_UPDATE || windowsDefaultConfig.updateUrl,
};

const wInstallerOptions: electronWinstaller.Options = {
  appDirectory: `wrap/build/${commonConfig.name}-win32-ia32`,
  authors: commonConfig.name,
  description: commonConfig.description,
  exe: `${commonConfig.name}.exe`,
  iconUrl: windowsConfig.installerIconUrl,
  loadingGif: windowsConfig.loadingGif,
  name: commonConfig.name,
  noMsi: true,
  outputDirectory: 'wrap/dist',
  setupExe: `${commonConfig.name}-Setup.exe`,
  setupIcon: `${commonConfig.electronDirectory}/img/logo.ico`,
  title: commonConfig.name,
  version: commonConfig.version.replace(/-.*$/, ''),
};

commonConfig.updateUrl = windowsConfig.updateUrl;

logEntries(commonConfig, 'commonConfig', toolName);

logger.info(`Building ${commonConfig.name} ${commonConfig.version} Installer for Windows ...`);

writeJson(wireJsonResolved, commonConfig)
  .then(() => electronWinstaller.createWindowsInstaller(wInstallerOptions))
  .then(() => {
    const outputDir = path.resolve(wInstallerOptions.outputDirectory || '');
    logger.log(`Built installer in "${outputDir}"`);
  })
  .finally(() => writeJson(wireJsonResolved, defaultConfig))
  .catch(error => {
    logger.error(error);
    process.exit(1);
  });
