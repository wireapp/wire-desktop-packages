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

import debug from 'debug';
import * as fs from 'fs-extra';

export class DiskPersistence {
  private static readonly data = {};
  private static readonly debug = debug('wire:updater:DiskPersistence');

  public constructor(private readonly file: string) {}

  public async set<T>(name: string, value: T): Promise<T> {
    if (typeof DiskPersistence.data[this.file] === 'undefined') {
      await this.readFromFile();
    }
    DiskPersistence.debug('Saving %s with "%o" as value', name, value);
    DiskPersistence.data[this.file][name] = value;
    return value;
  }

  public async get(name: string, defaultValue: any = undefined): Promise<any> {
    if (typeof DiskPersistence.data[this.file] === 'undefined') {
      await this.readFromFile();
    }

    DiskPersistence.debug('Restoring %s', name);
    const value = DiskPersistence.data[this.file][name];
    return typeof value !== 'undefined' ? value : defaultValue;
  }

  private async readFromFile(): Promise<void> {
    DiskPersistence.debug('Reading config file...');

    if (typeof DiskPersistence.data[this.file] === 'undefined') {
      DiskPersistence.debug('Reading config file');

      try {
        DiskPersistence.debug('Reading user configuration file...');

        await fs.ensureFile(this.file);
        DiskPersistence.data[this.file] = await fs.readJson(this.file);

        DiskPersistence.debug('%o', DiskPersistence.data[this.file]);
      } catch (error) {
        DiskPersistence.debug('Unable to parse the init file. Details: %s', error);
        DiskPersistence.data[this.file] = {};
      }
    }
  }

  public async saveChangesOnDisk(): Promise<void> {
    const data = DiskPersistence.data[this.file];

    if (typeof DiskPersistence.data[this.file] === 'undefined' || data === '') {
      DiskPersistence.debug('No configuration found to persist');
      return;
    }

    DiskPersistence.debug('Saving configuration to persistent storage: %o', data);
    try {
      await fs.writeJson(this.file, data);
    } catch (error) {
      DiskPersistence.debug('An error occurred while persisting the configuration: %s', error);
    }
  }
}
