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
import * as fs from 'fs-extra';
import * as path from 'path';

import {checkCommanderOptions, getLogger, getMacOSShortcutScript, getToolName} from '../lib/build-utils';

const toolName = getToolName(__filename);
const logger = getLogger(toolName);

commander
  .name(toolName)
  .description('Build a Wire shortcut for macOS')
  .option('-i, --bundle-id <id>', 'Specify the Wire bundle id', 'com.wearezeta.zclient.mac')
  .option('-b, --backend <url>', 'Specify the backend (required)')
  .option('-n, --app-name <name>', 'Specify the app name', 'Wire')
  .parse(process.argv);

checkCommanderOptions(commander, ['appName', 'backend', 'bundleId']);

logger.info(`Creating a shortcut for macOS ...`);

const outputDir = path.resolve(`./${commander.appName}.app`);
const shortcutScript = getMacOSShortcutScript(commander.bundleId, commander.backend);
const scriptFile = path.join(outputDir, commander.appName);

fs.mkdir(outputDir)
  .then(() => fs.writeFile(scriptFile, shortcutScript, 'utf8'))
  .then(() => fs.chmod(scriptFile, '755'))
  .then(() => logger.info(`Built shortcut in "${outputDir}".`))
  .catch(error => logger.error(error));
