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
import {dialog} from 'electron';
import {BaseError} from 'make-error-cause';

import {Config} from './Config';
import {DownloadError} from './Downloader';
import {InstallerError} from './Installer';
import {ProtobufError} from './Protobuf';
import {Sandbox} from './Sandbox';
import {LogicalError} from './Updater';
import {Utils} from './Utils';
import {IntegrityError, VerifyError, VerifyExpirationError} from './Verifier';

enum Response {
  CANCEL = 0,
  CONTACT_US = 1,
  TRY_AGAIN = 2,
}

enum ErrorCodes {
  // Updater
  LOGICAL = 1,

  // Protobuf (unable to read data)
  PROTOBUF = 1001,

  // Downloader
  DOWNLOADER = 1100,
  DOWNLOADER_ECONNRESET = 1101,
  DOWNLOADER_ECONNABORTED = 1102,

  // Verifier
  VERIFIER = 1200,
  VERIFIER_EXPIRED = 1201,
  INTEGRITY = 1202,

  // Installer
  INSTALLER = 1300,

  UNKNOWN = 0,
}

export interface ErrorDispatcherResponseInterface {
  tryAgain: boolean;
}

export class ErrorDispatcher {
  private static readonly debug: typeof debug = debug('wire:updater:errordispatcher');

  private static readonly LINK_BUGREPORT: string = Config.ErrorDispatcher.LINK_BUGREPORT;
  private static readonly RAYGUN_ENABLED: boolean = Config.ErrorDispatcher.RAYGUN_ENABLED;
  private static readonly RAYGUN_TOKEN: string = Config.ErrorDispatcher.RAYGUN_TOKEN;

  public static promptWindow?: Electron.BrowserWindow;
  public static installerWindow?: Electron.BrowserWindow;

  public static error: BaseError;

  private static async dialogCallback(resolve: Function, response: number, checkboxChecked: boolean) {
    // Destroy the prompt / installer window if present
    if (this.promptWindow) {
      this.promptWindow.destroy();
      this.promptWindow = undefined;
      this.debug('Destroyed prompt window');
    }
    if (this.installerWindow) {
      this.installerWindow.destroy();
      this.installerWindow = undefined;
      this.debug('Destroyed installer window');
    }

    this.debug('Reponse is %s', response);

    if (checkboxChecked) {
      this.debug('Report this incident checked');
      await this.reportError();
    }

    switch (response) {
      case Response.TRY_AGAIN:
        return resolve({tryAgain: true});

      case Response.CONTACT_US:
        Utils.openExternalLink(this.LINK_BUGREPORT);
        break;
    }

    return resolve({tryAgain: false});
  }

  private static async reportError(): Promise<void> {
    if (!this.RAYGUN_ENABLED || !this.RAYGUN_TOKEN || !this.error) {
      return;
    }

    await new Sandbox('RaygunReport').run(
      {
        RaygunDetails: {name: this.error.name, errorCode: this.getErrorCode(), category: 'Updater'},
        RaygunError: this.error.cause instanceof Error ? this.error.cause : this.error,
        RaygunToken: this.RAYGUN_TOKEN,
      },
      {
        require: {
          context: 'host',
          external: ['raygun'],
          root: '../',
        },
      }
    );
  }

  private static getErrorCode(): number {
    if (this.error instanceof ProtobufError) {
      this.debug('Protobuf decompression error detected');

      return ErrorCodes.PROTOBUF;
    } else if (this.error instanceof DownloadError) {
      this.debug('Download error detected.');

      if ((<any>this.error).cause.code === 'ECONNRESET') {
        this.debug('Connection reset');

        return ErrorCodes.DOWNLOADER_ECONNRESET;
      } else if ((<any>this.error).cause.code === 'ECONNABORTED') {
        this.debug('Connection aborted');

        return ErrorCodes.DOWNLOADER_ECONNABORTED;
      }

      return ErrorCodes.DOWNLOADER;
    } else if (this.error instanceof IntegrityError) {
      this.debug('Integrity error detected');

      return ErrorCodes.INTEGRITY;
    } else if (this.error instanceof LogicalError) {
      this.debug('Logical error detected');

      return ErrorCodes.LOGICAL;
    } else if (this.error instanceof VerifyError) {
      this.debug('Verify error detected');

      return ErrorCodes.VERIFIER;
    } else if (this.error instanceof VerifyExpirationError) {
      this.debug('Verify (expired) error detected');

      return ErrorCodes.VERIFIER_EXPIRED;
    } else if (this.error instanceof InstallerError) {
      this.debug('Installer error detected');

      return ErrorCodes.INSTALLER;
    }

    // Unknown error
    return ErrorCodes.UNKNOWN;
  }

  public static dispatch(): Promise<ErrorDispatcherResponseInterface> {
    return new Promise((resolve, reject) => {
      // ToDo: Localization
      this.debug('%o', this.error);

      // Build buttons
      const buttons: string[] = [];
      buttons[Response.CANCEL] = 'Cancel';
      buttons[Response.TRY_AGAIN] = 'Try again';
      buttons[Response.CONTACT_US] = 'Contact us';

      const errorCode: number = this.getErrorCode();

      // Assume that if promptWindow is available then we already checked the update
      // Assume that if installerWindow is available then we are already trying to download and install the update
      let message: string;
      if (errorCode === ErrorCodes.UNKNOWN) {
        message = 'An unknown error happened while trying to check for updates.';
      } else if (this.promptWindow) {
        message = `An error happened while processing the update (${errorCode})`;
      } else if (this.installerWindow) {
        message = `An error happened while installing the update (${errorCode})`;
      } else {
        message = `An error happened while trying to check for updates (${errorCode})`;
      }

      // Options for the dialog
      const options: Electron.MessageBoxOptions = {
        buttons,
        message,
        title: 'Wire Updater',
        type: 'error',
      };

      if (this.RAYGUN_ENABLED && this.RAYGUN_TOKEN) {
        options.checkboxChecked = true;
        options.checkboxLabel = 'Report this incident to Wire';
      }

      this.debug('Showing errorDispatcher prompt');
      try {
        dialog.showMessageBox(options, async (response: number, checkboxChecked: boolean) =>
          this.dialogCallback(resolve, response, checkboxChecked)
        );
      } catch (error) {
        this.debug(error);
      }
    });
  }
}
