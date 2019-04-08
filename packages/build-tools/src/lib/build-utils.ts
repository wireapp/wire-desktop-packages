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

import commander from 'commander';
import * as fs from 'fs-extra';
import logdown from 'logdown';

function checkCommanderOptions(commanderInstance: typeof commander, options: string[]): void {
  options.forEach(option => {
    if (!commanderInstance.hasOwnProperty(option)) {
      commanderInstance.outputHelp();
      process.exit(1);
    }
  });
}

function getLogger(postfix: string): logdown.Logger {
  const logger = logdown(`@wireapp/deploy-tools/${postfix}`, {
    logger: console,
    markdown: false,
  });
  logger.state.isEnabled = true;

  return logger;
}

async function writeJson<T extends Object>(fileName: string, data: T): Promise<void> {
  await fs.writeFile(fileName, `${JSON.stringify(data, null, 2)}\n`);
}

function getMacOSShortcutScript(bundleId: string, backend: string): string {
  return `#!/usr/bin/env bash
WIRE_PATH="$(mdfind kMDItemCFBundleIdentifier="${bundleId}")"
if [ -z "\${WIRE_PATH}" ]; then
  osascript -e 'display alert "Could not find local Wire app installation." as critical'
  exit
fi
open -a "\${WIRE_PATH}" --args --env "${backend}"`;
}

function getWindowsShortcut(exeFile: string, backend: string): string {
  const fullExe = `%APPDATA%\\${exeFile.replace('.exe', '')}\\${exeFile}}`;
  return `${fullExe} --env ${backend}`;
}

export {checkCommanderOptions, getLogger, getMacOSShortcutScript, getWindowsShortcut, writeJson};
