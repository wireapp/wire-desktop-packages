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

import * as compareVersions from 'compare-versions';
import * as debug from 'debug';
import {Notification, app, shell} from 'electron';
import * as fsExtra from 'fs-extra';
import {DateTime} from 'luxon';
import * as path from 'path';
import {Config} from './Config';

export interface WebappVersionInterface {
  buildDate: DateTime;
  environment?: string;
}

// If available, use the unpatched fs module by Electron
// (It allows us to write ASAR files)
const fs = (() => {
  let fs: any;
  try {
    fs = require('original-fs');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      fs = require('fs');
    } else {
      throw error;
    }
  }
  return fs;
})();

export class Utils {
  private static readonly debug: typeof debug = debug(`wire:updater:utils`);
  private static readonly USER_DATA_FOLDER: string = typeof app !== 'undefined' ? app.getPath('userData') : '';
  private static readonly WEBAPP_VERSION_FORMAT: string = 'yyyy-MM-dd-HH-mm';

  public static async readFileAsBuffer(path: string): Promise<Buffer> {
    return fs.readFileSync(path);
  }

  public static async readFileAsString(path: string): Promise<string> {
    return fs.readFileSync(path, {encoding: 'utf8'});
  }

  public static async writeFileAsBuffer(path: string, data: Buffer): Promise<void> {
    return fs.writeFileSync(path, data);
  }

  public static async deleteFile(path: string): Promise<void> {
    return fsExtra.remove(path);
  }

  public static async displayNotification(
    options: Electron.NotificationConstructorOptions,
    callback: (type: string, event: Event, index?: number) => void
  ): Promise<Notification> {
    const notification = new Notification(options);

    notification.show();
    notification.once('click', event => callback('click', event));
    notification.once('action', (event, action) => callback('action', event, action));

    return notification;
  }

  public static isValidVersion(input: string): boolean {
    input = input.trim();
    if (input === '') {
      return false;
    }
    return new RegExp(/^\d{1,3}\.\d{1,3}(?:\.\d{1,4})?$/g).test(input);
  }

  public static parseWebappVersion(formattedWebappVersion: string): WebappVersionInterface {
    formattedWebappVersion = formattedWebappVersion.trim();

    const envRegex = /-([a-z]*)$/;
    const environment = envRegex.exec(formattedWebappVersion);

    // Convert to a date object
    return {
      buildDate: DateTime.fromFormat(formattedWebappVersion.replace(envRegex, ''), Utils.WEBAPP_VERSION_FORMAT, {
        zone: 'Europe/Berlin',
      }),
      // e.g. [ '-prod', 'prod', index: 16, input: '2018-02-07-20-54-prod' ]
      environment: environment ? environment[1] : '',
    };
  }

  public static formatWebappVersion({buildDate}: WebappVersionInterface): string {
    return buildDate.toFormat(`${Utils.WEBAPP_VERSION_FORMAT}`);
  }

  public static formatWebappVersionFull({buildDate, environment}: WebappVersionInterface): string {
    const environmentFormat = typeof environment !== 'undefined' ? `'-${environment}'` : '';
    return buildDate.toFormat(`${Utils.WEBAPP_VERSION_FORMAT}${environmentFormat}`);
  }

  public static compareClientVersion(leftVersion: string, rightVersion: string): number {
    return compareVersions(leftVersion, rightVersion);
  }

  public static getFilenameFromChecksum(checksum: Buffer) {
    return `${checksum.toString('hex').substr(0, Config.Updater.FILENAME_CHECKSUM_LENGTH)}.${
      Config.Updater.DEFAULT_FILE_EXTENSION
    }`;
  }

  public static async ensureUpdaterFolderExists(): Promise<void> {
    await fsExtra.ensureDir(Utils.resolveRootPath());
  }

  public static resolvePath(filename: string = ''): string {
    return path.join(Utils.USER_DATA_FOLDER, Config.Updater.UPDATER_DATA_FOLDER_NAME, filename);
  }

  public static resolveRootPath(): string {
    return Utils.resolvePath();
  }

  public static openExternalLink(url: string, secure: boolean = true): void {
    if (url.startsWith('https://') === false && secure === true) {
      this.debug('Denied to open external URL: %s', url);
      return;
    }

    this.debug('Opening external URL: %s', url);
    shell.openExternal(url);
  }

  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
