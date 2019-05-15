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
import {getLocales} from './Localization';
import {Utils} from './Utils';
import {WindowManager} from './WindowManager';

import {BridgeIPC, ProgressInterface} from '@wireapp/desktop-updater-spec';
import {BaseError} from 'make-error-cause';

export class InstallerError extends BaseError {}

export class Installer extends WindowManager {
  private static readonly debug = debug(`wire:updater:installer`);

  public async BROWSER_WINDOW_OPTIONS(): Promise<Electron.BrowserWindowConstructorOptions> {
    return {
      closable: false,
      height: 153,
      title: await getLocales('installer:title'),
      width: 480,
    };
  }

  constructor(public mainWindow?: Electron.BrowserWindow) {
    super(mainWindow);
  }

  public async show(): Promise<void> {
    await super.prepare();
    const freezeBrowserWindow = this.freezeBrowserWindow(true);
    const show = super.show();
    await freezeBrowserWindow;
    await show;
  }

  public async close(): Promise<void> {
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      // Send a signal to the renderer when update is installed
      // Unfreeze the window
      if (this.mainWindow) {
        this.mainWindow.webContents.send(BridgeIPC.UPDATE_INSTALLED);
        await this.freezeBrowserWindow(false);
      }

      if (this.browserWindow) {
        this.browserWindow.setClosable(true);
        this.browserWindow.close();
      }
    } else {
      // Note: The error will be thrown in the main process
      throw new InstallerError(
        'Unexpected state. Installer window was closed before webapp finish from being updated.'
      );
    }
  }

  public didFinishLoad(): void {
    super.didFinishLoad();
    this.signalRenderer();
  }

  private async freezeBrowserWindow(freeze: boolean): Promise<void> {
    if (this.mainWindow) {
      if (freeze) {
        this.debug('Resize off');
        this.mainWindow.setResizable(false);
        const screenshot = await this.screenshotMainWindow();
        this.debug('Sent screenshot to webapp');
        this.mainWindow.webContents.send(BridgeIPC.UPDATE_START_INSTALL, {freeze: true, screenshot});
      } else {
        this.mainWindow.webContents.send(BridgeIPC.UPDATE_END_INSTALL);
        this.mainWindow.setResizable(true);
        await Utils.sleep(4500);
      }
    }
  }

  private async screenshotMainWindow(): Promise<string> {
    if (!this.mainWindow) {
      throw new Error('Main window is not available');
    }
    const img = await this.mainWindow.webContents.capturePage();
    // https://github.com/electron/electron/blob/master/docs/api/web-contents.md#contentscapturepagerect
    return (img as any).toDataURL();
  }

  /**
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
    const bundle = Utils.writeFileAsBuffer(Utils.resolvePath(fileName), fileRaw);
    const manifest = Utils.writeFileAsBuffer(Utils.resolvePath(Config.Updater.MANIFEST_FILE), envelopeRaw);
    await bundle;
    await manifest;
  }
}
