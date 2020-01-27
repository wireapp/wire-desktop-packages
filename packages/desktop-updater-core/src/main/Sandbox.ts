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

import * as path from 'path';

import debug from 'debug';
import {Utils} from './Utils';

import {NodeVM as VirtualMachine, NodeVMOptions} from 'vm2';

import {BaseError} from 'make-error-cause';
export class SandboxError extends BaseError {}
export class InternalSandboxError extends BaseError {}

export class Sandbox {
  private readonly debug = debug('wire:updater:sandbox');
  private script?: string;
  private readonly path: string;

  public constructor(readonly file: string, readonly userPath?: string) {
    this.path =
      typeof userPath === 'undefined'
        ? path.resolve(__dirname, 'Sandboxed', `${file}.js`)
        : path.resolve(userPath, file);
  }

  public async run(constants: {}, options: NodeVMOptions): Promise<any> {
    const vm = new VirtualMachine(options);

    // Pass the options to the VM as consts
    for (const name in constants) {
      vm.freeze(constants[name], name);
    }

    this.debug('Reading file to execute...');
    try {
      if (typeof this.script === 'undefined') {
        this.script = await Utils.readFileAsString(this.path);
      }
    } catch (error) {
      throw new SandboxError('Unable to read file to execute', error);
    }

    this.debug('Lauching VM...');
    return new Promise((resolve, reject) => {
      try {
        return vm.run(
          this.script!,
          this.path,
        )(data => {
          this.debug('Callback received');
          if (data instanceof Error) {
            this.debug('Fatal error inside sandbox detected');
            return reject(new InternalSandboxError('An error happened inside the VM (via callback)', data));
          }
          resolve(data);
        });
      } catch (error) {
        this.debug('Internal error occurred while running sandbox detected');
        this.debug(error);
        throw new SandboxError('An error happened inside the VM', error);
      }
    });
  }
}
