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
import debug from 'debug';
import {Notification, app, shell} from 'electron';
// fsExtra will use the patched fs from Electron
import * as fs from 'fs-extra';
import {DateTime} from 'luxon';
import * as path from 'path';
import {Config} from './Config';
import {Environment} from './Environment';

export interface WebappVersionInterface {
  buildDate: DateTime;
  environment?: string;
}

// If available, use the unpatched fs module by Electron as it allows us to write ASAR files
export const originalFs = (() => {
  try {
    return require('original-fs');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return require('fs');
    } else {
      throw error;
    }
  }
})();

export class Utils {
  private static readonly debug = debug(`wire:updater:utils`);
  private static readonly USER_DATA_FOLDER: string = typeof app !== 'undefined' ? app.getPath('userData') : '';
  private static readonly WEBAPP_VERSION_FORMAT: string = 'yyyy-MM-dd-HH-mm';

  public static async readFileAsBuffer(path: string, withoutASAR: boolean = false): Promise<Buffer> {
    if (withoutASAR) {
      return originalFs.readFileSync(path);
    }
    return fs.readFile(path);
  }

  public static async readFileAsString(path: string, withoutASAR: boolean = false): Promise<string> {
    const options = {encoding: 'utf8'};
    if (withoutASAR) {
      return originalFs.readFileSync(path, options);
    }
    return fs.readFile(path, options);
  }

  public static async writeFileAsBuffer(path: string, data: Uint8Array | Buffer): Promise<void> {
    return originalFs.writeFileSync(path, Buffer.from(data));
  }

  public static async deleteFile(path: string): Promise<void> {
    return fs.remove(path);
  }

  public static async displayNotification(
    options: Electron.NotificationConstructorOptions,
    callback: (type: string, event: Event, index?: number) => void,
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

  public static compareClientVersion(leftVersion: string, rightVersion: string): boolean {
    return compareVersions.compare(leftVersion, rightVersion, '>=');
  }

  public static getFilenameFromChecksum(checksum: Buffer): string {
    return `${checksum.toString('hex').substr(0, Config.Updater.FILENAME_CHECKSUM_LENGTH)}.${
      Config.Updater.DEFAULT_FILE_EXTENSION
    }`;
  }

  public static async ensureUpdaterFolderExists(): Promise<void> {
    await fs.ensureDir(Utils.resolveRootPath());
  }

  public static async getDocumentRoot(checksum: Buffer): Promise<string> {
    const documentRoot = Utils.resolvePath(Utils.getFilenameFromChecksum(checksum));
    // Use original filesystem as the document root is a asar file
    if (!originalFs.existsSync(documentRoot)) {
      throw Error('Document root does not exist');
    }
    return documentRoot;
  }

  private static readDirectory(source: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      originalFs.readdir(source, (error, files) => {
        if (error) {
          return reject(error);
        }
        resolve(files);
      });
    });
  }

  private static copyFile(from: string, to: string): Promise<void> {
    return new Promise((resolve, reject) => {
      originalFs.copyFile(from, to, error => {
        if (error) {
          return reject(error);
        }

        this.debug('"%s" has been successfully copied to "%s', from, to);
        resolve();
      });
    });
  }

  public static async copyFiles(from: string, to: string): Promise<void> {
    await Promise.all(
      (await this.readDirectory(from)).map(async filename => {
        this.debug('Filename is: %s', filename);
        const shouldCopy =
          filename.endsWith(`.${Config.Updater.DEFAULT_FILE_EXTENSION}`) || filename === Config.Updater.MANIFEST_FILE;
        if (shouldCopy) {
          await this.copyFile(path.resolve(from, filename), path.resolve(to, filename));
        } else {
          this.debug('"%s" has been skipped', filename);
        }
      }),
    );
  }

  public static async getLCBPath(): Promise<string> {
    const localPath = path.resolve(
      app.getAppPath(),
      // If the app is packaged, use /Applications/Wire.app/Contents/Resources/,
      // otherwise use ./wire-desktop/.bundle/internal, both are one directory up
      '../',
      Config.Updater.LOCAL_BUNDLE_FOLDER_NAME,
      `${Environment.currentEnvironment.toLowerCase()}/`,
    );
    this.debug('LCB path is %s', localPath);
    if (await !fs.pathExists(localPath)) {
      throw Error('LCB path does not exist');
    }
    return localPath;
  }

  public static resolvePath(filename: string = ''): string {
    return path.join(Utils.USER_DATA_FOLDER, Config.Updater.UPDATER_DATA_FOLDER_NAME, filename);
  }

  public static resolveRootPath(): string {
    return Utils.resolvePath();
  }

  public static async openExternalLink(url: string, secure: boolean = true): Promise<void> {
    if (url.startsWith('https://') === false && secure === true) {
      this.debug('Denied to open external URL: %s', url);
      return;
    }

    this.debug('Opening external URL: %s', url);
    await shell.openExternal(url);
  }

  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
