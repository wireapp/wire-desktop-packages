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

import {Config} from './Config';
import {Updater} from './Updater';
import {WindowManager} from './WindowManager';

import {BaseError} from 'make-error-cause';
export class PromptError extends BaseError {}

export class Prompt extends WindowManager {
  private static readonly IPC_DECISION_NAME: string = Config.Prompt.IPC_DECISION_NAME;

  public readonly BROWSER_WINDOW_OPTIONS: Electron.BrowserWindowConstructorOptions = {
    height: 287,
    title: 'An update is available for Wire',
    width: 480,
  };

  constructor(
    public mainWindow: Electron.BrowserWindow | undefined,
    private readonly Manifest: Updater.Manifest,
    protected currentWebappVersion: string,
    private readonly isWebappBlacklisted: boolean,
    private readonly isWebappTamperedWith: boolean,
    private readonly isUpdatesInstallAutomatically: boolean
  ) {
    super(mainWindow);
  }

  /**
   * Show the update prompt
   */
  public show(): Promise<Updater.Decision> {
    super.prepare();

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
        })
      );

      // Close window via escape if webapp is not blacklisted
      if (!this.isWebappBlacklisted) {
        this.browserWindow.webContents.on('before-input-event', (event, input) => {
          if (this.browserWindow && input.type === 'keyDown' && input.key === 'Escape') {
            this.browserWindow.close();
          }
        });
      }

      super.show();

      // Unregister the window and the IPC event then cancel the update when window is closed
      this.browserWindow.once('closed', () => {
        ipcMain.removeAllListeners(Prompt.IPC_DECISION_NAME);

        // Resolve don't update (will be ignored if already resolved from ipc main)
        resolve({
          allow: false,
          installAutomatically: false,
          skipThisUpdate: false,
        });
      });
    });
  }

  public didFinishLoad(): void {
    super.didFinishLoad();
    this.signalRenderer({
      changelogUrl: Config.Updater.CHANGELOG_URL,
      isUpdatesInstallAutomatically: this.isUpdatesInstallAutomatically,
      isWebappBlacklisted: this.isWebappBlacklisted,
      isWebappTamperedWith: this.isWebappTamperedWith,
      manifest: this.Manifest,
    });
  }

  private async onDecision(event, options: Updater.Decision): Promise<Updater.Decision> {
    this.debug('onDecision called');
    this.debug('Options: %o', options);

    if (!this.browserWindow) {
      throw new PromptError('Prompt was not available');
    }

    // Sec: Ensure the decision dialog come indeed from the Prompt window
    if (event.sender.id !== this.browserWindow.webContents.id) {
      throw new PromptError('The decision did not came from the Prompt window');
    }

    return options;
  }
}
