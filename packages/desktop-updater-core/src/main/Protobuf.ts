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

import * as protobuf from 'protobufjs';

import {BaseError} from 'make-error-cause';
export class ProtobufError extends BaseError {}

export class Protobuf {
  public static async loadRoot(pathName: string | string[]): Promise<protobuf.Root> {
    return protobuf.load(pathName);
  }

  private static lookupType(type: string, root: protobuf.Root): protobuf.Type {
    return root.lookupType(`updater.${type}`);
  }

  public static async decodeBuffer(root: protobuf.Root, type: string, buffer: Buffer): Promise<{[k: string]: any}> {
    try {
      const decodeMessage = this.lookupType(type, root);
      return decodeMessage.toObject(decodeMessage.decode(buffer));
    } catch (error) {
      throw new ProtobufError(error.message, error);
    }
  }

  public static async encodeBuffer(root: any, type: string, data: {}): Promise<Uint8Array> {
    try {
      const updateMessage = this.lookupType(type, root);
      return updateMessage.encode(updateMessage.create(data)).finish();
    } catch (error) {
      throw new ProtobufError(error.message, error);
    }
  }
}
