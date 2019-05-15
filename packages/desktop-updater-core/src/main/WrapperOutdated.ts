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
import * as os from 'os';

import {Config} from './Config';
import {Utils} from './Utils';

import {WindowManager} from './WindowManager';

import {BaseError} from 'make-error-cause';
import {getLocales} from './Localization';
export class WrapperOutdatedError extends BaseError {}

export interface WrapperOutdatedInterface {
  showDetails: boolean;
}

export class WrapperOutdated extends WindowManager {
  private static readonly ENVIRONMENT: string = os.type();
  private static readonly IS_MACOS: boolean = WrapperOutdated.ENVIRONMENT === 'Darwin';

  public async BROWSER_WINDOW_OPTIONS(): Promise<Electron.BrowserWindowConstructorOptions> {
    return {
      height: 203,
      title: await getLocales('wrapper-outdated:title'),
      width: 480,
    };
  }

  constructor(public mainWindow?: Electron.BrowserWindow) {
    super(mainWindow);
  }

  public async show(): Promise<void> {
    await super.prepare();
    await super.show();
  }

  public whenClosed(): void {
    super.whenClosed();

    // Quit the app when window is closed
    process.exitCode = 0;
  }

  public async close(event: Event, options: WrapperOutdatedInterface): Promise<void> {
    const {showDetails} = options;
    if (showDetails === true) {
      if (WrapperOutdated.IS_MACOS) {
        await Utils.openExternalLink(Config.WrapperOutdated.WRAPPER_UPDATE_LINK_MACOS, false);
      } else {
        await Utils.openExternalLink(Config.WrapperOutdated.WRAPPER_UPDATE_LINK_OTHERS);
      }
    }

    if (this.browserWindow && this.browserWindow.isClosable()) {
      this.browserWindow.close();
    }
  }

  public didFinishLoad(): void {
    super.didFinishLoad();

    ipcMain.once('onButtonClicked', (event, options) => this.close(event, options));
    this.signalRenderer({
      environment: WrapperOutdated.ENVIRONMENT,
    });
  }
}
