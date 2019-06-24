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
import * as electronBuilder from 'electron-builder';
import * as fs from 'fs-extra';
import * as path from 'path';

import {checkCommanderOptions, getLogger, getToolName, writeJson} from '../lib/build-utils';
import {getCommonConfig, logEntries} from '../lib/commonConfig';
import {LinuxConfig} from '../lib/Config';

const toolName = getToolName(__filename);
const logger = getLogger(toolName);

commander
  .name(toolName)
  .description('Build the Wire wrapper for Linux')
  .option('-w, --wire-json <path>', 'Specify the wire.json path')
  .parse(process.argv);

checkCommanderOptions(commander, ['wireJson']);

const wireJsonResolved = path.resolve(commander.wireJson);
const {commonConfig, defaultConfig} = getCommonConfig({envFile: '.env.defaults', wireJson: wireJsonResolved});
const packageJson = path.resolve('package.json');
const originalPackageJson = fs.readJsonSync(packageJson);

const linuxDefaultConfig: LinuxConfig = {
  /* tslint:disable:no-invalid-template-strings */
  artifactName: '${productName}-${version}_${arch}.${ext}',
  categories: 'Network;InstantMessaging;Chat;VideoConference',
  executableName: `${commonConfig.nameShort}-desktop`,
  keywords: 'chat;encrypt;e2e;messenger;videocall',
  targets: ['AppImage', 'deb', 'rpm'],
};

const linuxConfig: LinuxConfig = {
  ...linuxDefaultConfig,
  categories: process.env.LINUX_CATEGORIES || linuxDefaultConfig.categories,
  executableName: process.env.LINUX_NAME_SHORT || linuxDefaultConfig.executableName,
  keywords: process.env.LINUX_KEYWORDS || linuxDefaultConfig.keywords,
  targets: process.env.LINUX_TARGET ? [process.env.LINUX_TARGET] : linuxDefaultConfig.targets,
};

const linuxDesktopConfig = {
  Categories: linuxConfig.categories,
  GenericName: commonConfig.description,
  Keywords: linuxConfig.keywords,
  MimeType: `x-scheme-handler/${commonConfig.customProtocolName}`,
  Name: commonConfig.name,
  StartupWMClass: commonConfig.name,
  Version: '1.1',
};

const platformSpecificConfig = {
  afterInstall: 'bin/deb/after-install.tpl',
  afterRemove: 'bin/deb/after-remove.tpl',
  category: 'Network',
  desktop: linuxDesktopConfig,
  fpm: ['--name', linuxConfig.executableName],
};

const rpmDepends = ['alsa-lib', 'GConf2', 'libappindicator', 'libnotify', 'libXScrnSaver', 'libXtst', 'nss'];
const debDepends = ['libappindicator1', 'libasound2', 'libgconf-2-4', 'libnotify-bin', 'libnss3', 'libxss1'];

const builderConfig: electronBuilder.Configuration = {
  asar: false,
  buildVersion: commonConfig.version,
  deb: {
    ...platformSpecificConfig,
    depends: debDepends,
  },
  directories: {
    buildResources: 'resources',
    output: 'wrap/dist',
  },
  extraMetadata: {
    homepage: commonConfig.websiteUrl,
  },
  linux: {
    artifactName: linuxConfig.artifactName,
    category: platformSpecificConfig.category,
    depends: debDepends,
    executableName: linuxConfig.executableName,
    target: linuxConfig.targets,
  },
  productName: commonConfig.name,
  publish: null,
  rpm: {
    ...platformSpecificConfig,
    depends: rpmDepends,
  },
};

logEntries(commonConfig, 'commonConfig', toolName);

const targets = electronBuilder.Platform.LINUX.createTarget(linuxConfig.targets, electronBuilder.archFromString('x64'));

logger.info(
  `Building ${commonConfig.name} ${commonConfig.version} for Linux (targets: ${linuxConfig.targets.join(', ')})...`,
);

writeJson(packageJson, {...originalPackageJson, productName: commonConfig.name, version: commonConfig.version})
  .then(() => writeJson(wireJsonResolved, commonConfig))
  .then(() => electronBuilder.build({config: builderConfig, targets}))
  .then(buildFiles => buildFiles.forEach(buildFile => logger.log(`Built package "${buildFile}".`)))
  .finally(() => Promise.all([writeJson(wireJsonResolved, defaultConfig), writeJson(packageJson, originalPackageJson)]))
  .catch(error => {
    logger.error(error);
    process.exit(1);
  });
