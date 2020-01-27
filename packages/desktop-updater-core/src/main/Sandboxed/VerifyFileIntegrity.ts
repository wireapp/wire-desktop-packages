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

import sodium from 'libsodium-wrappers';

declare const FileAsBuffer: Buffer;

class VerifyFileIntegrity {
  public static async do(): Promise<Buffer | Error> {
    await sodium.ready;
    try {
      const fileChecksum = sodium.crypto_generichash(sodium.crypto_generichash_BYTES_MAX, FileAsBuffer);
      return Buffer.from(fileChecksum);
    } catch (stack) {
      return new Error(stack);
    }
  }
}

export = async (callback: Function) => callback(await VerifyFileIntegrity.do());
