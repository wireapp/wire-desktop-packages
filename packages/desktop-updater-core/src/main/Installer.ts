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

import * as debug from 'debug';

import {Config} from './Config';
import {ProgressInterface} from './Sandboxed/Request';
import {Utils} from './Utils';

import {WindowManager} from './WindowManager';

import {BaseError} from 'make-error-cause';
export class InstallerError extends BaseError {}

export class Installer extends WindowManager {
  // Static
  private static readonly debug: typeof debug = debug(`wire:updater:installer`);

  public readonly BROWSER_WINDOW_OPTIONS: Electron.BrowserWindowConstructorOptions = {
    closable: false,
    height: 183,
    title: 'Installing the update...',
    width: 480,
  };

  constructor(public mainWindow?: Electron.BrowserWindow) {
    super(mainWindow);
  }

  /**
   * Show the update prompt
   */
  public async show(): Promise<void> {
    super.prepare();
    super.show();

    await this.freezeBrowserWindow();
    await this.windowToBeShown();
  }

  public async close(): Promise<void> {
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      // Send a signal to the renderer when update is installed
      // Unfreeze the window
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-installed');
        await this.freezeBrowserWindow(false);
      }

      if (this.browserWindow) {
        this.browserWindow.setClosable(true);
        this.browserWindow.close();
      }
    } else {
      // Throw an error in the main process
      throw new InstallerError(
        'Unexpected state. Installer window was closed before webapp finish from being updated.'
      );
    }
  }

  public didFinishLoad(): void {
    super.didFinishLoad();
    this.signalRenderer();
  }

  private windowToBeShown(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.browserWindow) {
        this.browserWindow.once('ready-to-show', () => resolve());
      } else {
        reject();
      }
    });
  }

  private async freezeBrowserWindow(freeze: boolean = true): Promise<void> {
    if (this.mainWindow) {
      if (freeze === true) {
        this.debug('Resize off');
        this.mainWindow.setResizable(false);
        const screenshot = await this.screenshotMainWindow();
        this.debug('Sent screenshot to webapp');
        this.mainWindow.webContents.send('update-start-install', {freeze: true, screenshot});
      } else {
        this.mainWindow.webContents.send('update-end-install');
        this.mainWindow.setResizable(true);
        await Utils.sleep(4500);
      }
    }
  }

  private screenshotMainWindow(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.mainWindow) {
        this.mainWindow.capturePage(img => resolve(img.toDataURL()));
      } else {
        reject();
      }
    });
  }

  /**
   * Track download progress (called from within the sandbox)
   *
   * @param progressEvent Progress interface
   */
  public onDownloadProgress(progressEvent: ProgressInterface): void {
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      this.browserWindow.webContents.send('progress', progressEvent);
    }
  }

  public static async save(fileName: string, fileRaw: Buffer, envelopeRaw: Buffer): Promise<void> {
    this.debug('Saving bundle and manifest...');
    await Promise.all([
      Utils.writeFileAsBuffer(Utils.resolvePath(fileName), fileRaw), // Bundle
      Utils.writeFileAsBuffer(Utils.resolvePath(Config.Updater.MANIFEST_FILE), envelopeRaw), // Manifest
    ]);
  }
}
