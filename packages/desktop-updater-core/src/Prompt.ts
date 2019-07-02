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

import {ipcMain} from 'electron';

import {ConfigPrompt, ConfigUpdater} from './Config';

import {getLocales} from './Localization';
import {Updater} from './Updater';
import {WindowManager} from './WindowManager';

import {BaseError} from 'make-error-cause';
export class PromptError extends BaseError {}

export class Prompt extends WindowManager {
  private static readonly IPC_DECISION_NAME: string = ConfigPrompt.IPC_DECISION_NAME;

  public get BROWSER_WINDOW_OPTIONS(): () => Promise<Partial<Electron.BrowserWindowConstructorOptions>> {
    return async () => ({
      height: 250,
      title: await getLocales('prompt:title'),
      width: 480,
    });
  }

  constructor(
    public mainWindow: Electron.BrowserWindow | undefined,
    private readonly Manifest: Updater.Manifest,
    private readonly Envelope: Updater.Envelope,
    protected currentWebappVersion: string,
    private readonly isWebappBlacklisted: boolean,
    private readonly isWebappTamperedWith: boolean,
    private readonly isUpdatesInstallAutomatically: boolean,
  ) {
    super(mainWindow);
  }

  public async show(): Promise<Updater.Decision> {
    await super.prepare();

    return new Promise(async resolve => {
      if (typeof this.browserWindow === 'undefined') {
        throw new Error('Browser window not available');
      }

      // Register Decision IPC event
      ipcMain.once(Prompt.IPC_DECISION_NAME, (event, options) =>
        this.onDecision(event, options).then(options => {
          resolve(options);

          // Close the window
          if (this.browserWindow) {
            this.browserWindow.close();
          }
        }),
      );

      // Close window via escape if webapp is not blacklisted
      if (!this.isWebappBlacklisted) {
        this.browserWindow.webContents.on('before-input-event', (event, input) => {
          if (this.browserWindow && input.type === 'keyDown' && input.key === 'Escape') {
            this.browserWindow.close();
          }
        });
      }

      await super.show();

      // Unregister the window and the IPC event then cancel the update when window is closed
      this.browserWindow.once('closed', () => {
        ipcMain.removeAllListeners(Prompt.IPC_DECISION_NAME);

        // Resolve but don't update (will be ignored if already resolved from `ipcMain`)
        resolve({
          allow: false,
          installAutomatically: false,
        });
      });
    });
  }

  public didFinishLoad(): void {
    super.didFinishLoad();
    this.signalRenderer({
      changelogUrl: ConfigUpdater.CHANGELOG_URL,
      envelope: {
        publicKey: Buffer.from(this.Envelope.publicKey).toString('hex'),
      },
      isUpdatesInstallAutomatically: this.isUpdatesInstallAutomatically,
      isWebappBlacklisted: this.isWebappBlacklisted,
      isWebappTamperedWith: this.isWebappTamperedWith,
      manifest: {
        ...this.Manifest,
        fileChecksum: Buffer.from(this.Manifest.fileChecksum).toString('hex'),
        fileChecksumCompressed: Buffer.from(this.Manifest.fileChecksumCompressed).toString('hex'),
      },
    });
  }

  private async onDecision(event, options: Updater.Decision): Promise<Updater.Decision> {
    this.debug('onDecision called');
    this.debug('Options: %o', options);

    if (!this.browserWindow) {
      throw new PromptError('Prompt was not available');
    }

    // Ensure the decision dialog indeed comes from the prompt window
    if (event.sender.id !== this.browserWindow.webContents.id) {
      throw new PromptError('The decision did not come from the prompt window');
    }

    return options;
  }
}
