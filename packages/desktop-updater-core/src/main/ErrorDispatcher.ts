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

import {DownloadError} from './Downloader';
import {InstallerError} from './Installer';
import {getLocales} from './Localization';
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
  private static readonly debug = debug('wire:updater:errordispatcher');

  public static installerWindow?: Electron.BrowserWindow;
  public static promptWindow?: Electron.BrowserWindow;
  public static raygunToken?: string;
  public static supportLink?: string;

  public static error: BaseError;

  private static async dialogCallback(
    resolve: Function,
    response: number,
    checkboxChecked: boolean
  ): Promise<{tryAgain: boolean}> {
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
        if (ErrorDispatcher.supportLink) {
          await Utils.openExternalLink(ErrorDispatcher.supportLink);
        }
        break;
    }

    return resolve({tryAgain: false});
  }

  private static async reportError(): Promise<void> {
    if (!ErrorDispatcher.raygunToken || !this.error) {
      return;
    }

    await new Sandbox('RaygunReport').run(
      {
        RaygunDetails: {name: this.error.name, errorCode: this.getErrorCode(), category: 'Updater'},
        RaygunError: this.error.cause instanceof Error ? this.error.cause : this.error,
        RaygunToken: ErrorDispatcher.raygunToken,
      },
      {
        require: {
          context: 'host',
          external: ['raygun'],
          // ToDo: Until folder where the node_modules is known, disable root folder restrictions
          //root: path.resolve(__dirname,  '../'),
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

      if (this.error.cause) {
        const code: string | undefined = this.error.cause['code'];
        if (code === 'ECONNRESET') {
          this.debug('Connection reset');

          return ErrorCodes.DOWNLOADER_ECONNRESET;
        } else if (code === 'ECONNABORTED') {
          this.debug('Connection aborted');

          return ErrorCodes.DOWNLOADER_ECONNABORTED;
        }
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
    return new Promise(async resolve => {
      this.debug('%o', this.error);

      // Build buttons
      const buttons: string[] = [];
      buttons[Response.CANCEL] = await getLocales('error-dispatcher:cancel');
      buttons[Response.TRY_AGAIN] = await getLocales('error-dispatcher:tryAgain');
      if (ErrorDispatcher.supportLink) {
        buttons[Response.CONTACT_US] = await getLocales('error-dispatcher:contactUs');
      }

      const errorCode: number = this.getErrorCode();

      // Assume that if promptWindow is available then we already checked the update
      // Assume that if installerWindow is available then we are already trying to download and install the update
      let message: string;
      if (errorCode === ErrorCodes.UNKNOWN) {
        message = await getLocales('error-dispatcher:errorUnknown');
      } else if (this.promptWindow) {
        message = await getLocales('error-dispatcher:errorWhileProcessingUpdate', {errorCode});
      } else if (this.installerWindow) {
        message = await getLocales('error-dispatcher:errorWhileInstallingUpdate', {errorCode});
      } else {
        message = await getLocales('error-dispatcher:errorWhileCheckingForUpdates', {errorCode});
      }

      const options: Electron.MessageBoxOptions = {
        buttons,
        message,
        title: await getLocales('error-dispatcher:title'),
        type: 'error',
      };

      if (ErrorDispatcher.raygunToken) {
        options.checkboxChecked = true;
        options.checkboxLabel = await getLocales('error-dispatcher:reportThisIncident');
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
