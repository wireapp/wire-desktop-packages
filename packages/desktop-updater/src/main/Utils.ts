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

import debug from 'debug';
import * as fs from 'fs-extra';

export class Utils {
  public static async readFileAsBuffer(path: string): Promise<Buffer> {
    return fs.readFileSync(path);
  }

  public static async readFileAsString(path: string): Promise<string> {
    return fs.readFileSync(path, {encoding: 'utf8'});
  }
}

export class UploadData {
  private static readonly debug: typeof debug = debug('wire:uploaddata');

  private static getBlobFromUUID(ses: Electron.Session, identifier: string): Promise<Buffer> {
    return new Promise(resolve => ses.getBlobData(identifier, result => resolve(result)));
  }

  public static async getData(uploadData: Electron.UploadData[], ses: Electron.Session): Promise<Buffer | undefined> {
    const data = uploadData[0] || {};

    if (data.blobUUID) {
      UploadData.debug('Getting upload data Blob from UUID "%s"', data.blobUUID);
      return this.getBlobFromUUID(ses, data.blobUUID);
    }

    if (data.bytes) {
      UploadData.debug('Getting upload data bytes');
      return data.bytes;
    }

    return undefined;
  }
}
