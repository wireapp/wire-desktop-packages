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

import * as sodium from 'libsodium-wrappers';

declare const Data: Buffer;
declare const Signature: Buffer;
declare const PublicKey: Buffer;

class VerifyEnvelopeIntegrity {
  public static async do(): Promise<boolean | Error> {
    await sodium.ready;
    try {
      return sodium.crypto_sign_verify_detached(
        new Uint8Array(Signature),
        new Uint8Array(Data),
        new Uint8Array(PublicKey)
      );
    } catch (stack) {
      return new Error(stack);
    }
  }
}

export = async (callback: Function) => callback(await VerifyEnvelopeIntegrity.do());
