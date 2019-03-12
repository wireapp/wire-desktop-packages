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
import {BrowserWindow, ipcMain, session, shell} from 'electron';
import * as os from 'os';
import * as path from 'path';
import {URL, fileURLToPath} from 'url';

export interface WindowSizeInterface {
  height: number;
  width: number;
}

export abstract class WindowManager {
  private readonly WINDOW_TYPE = this.constructor.name;
  protected static readonly STATUS_BAR_HEIGHT: number = os.type() === 'Darwin' ? 22 : 0;
  protected static readonly SESSION_NAME: string = 'zupdater';

  protected readonly debug = debug(`wire:updater:${this.constructor.name.toLowerCase()}`);

  constructor(protected mainWindow?: Electron.BrowserWindow) {}

  protected browserWindow?: Electron.BrowserWindow;

  private readonly attachedMode: boolean = typeof this.mainWindow !== 'undefined';
  private readonly RENDERER_DOCUMENT_ROOT: string = path.join(
    __dirname,
    '../../node_modules/@wireapp/desktop-updater-ui'
  );
  protected readonly RENDERER_HTML: string = path.join(this.RENDERER_DOCUMENT_ROOT, '.renderer/index.html');
  protected readonly RENDERER_PRELOAD: string = path.join(__dirname, `Preloads/${this.WINDOW_TYPE}.js`);
  private readonly BROWSER_WINDOW_DEFAULTS: Electron.BrowserWindowConstructorOptions = {
    backgroundColor: this.attachedMode ? undefined : '#f7f8fa',
    center: true,
    fullscreen: false,
    maximizable: false,
    minimizable: this.attachedMode ? false : true,
    // "A modal window is a child window that disables parent window,
    // to create a modal window, you have to set both parent and modal options"...
    modal: this.attachedMode ? true : undefined,
    parent: this.attachedMode && this.mainWindow ? this.mainWindow : undefined,
    resizable: false,
    show: false,
    titleBarStyle: this.attachedMode ? undefined : 'hidden',
    vibrancy: this.attachedMode ? 'light' : undefined,
    webPreferences: {
      allowRunningInsecureContent: false,
      contextIsolation: false,
      enableRemoteModule: false,
      javascript: true,
      nodeIntegration: false,
      plugins: false,
      preload: this.RENDERER_PRELOAD,
      sandbox: true,
      session: session.fromPartition(WindowManager.SESSION_NAME),
      webSecurity: true,
      webviewTag: false,
    },
  };

  abstract BROWSER_WINDOW_OPTIONS: Electron.BrowserWindowConstructorOptions;

  protected whenClosed(): void {
    this.debug('whenClosed called');
    ipcMain.removeAllListeners('resize');
  }

  protected didFinishLoad(): void {
    this.debug('didFinishLoad called');
  }

  public onReadyToShow(): void {
    this.debug('onReadyToShow called');
    if (this.browserWindow) {
      this.browserWindow.show();
    }
  }

  public prepare(): void {
    if (typeof this.browserWindow !== 'undefined') {
      this.browserWindow.close();
      this.browserWindow.destroy();
    }

    // Fix height
    let height = <number>this.BROWSER_WINDOW_OPTIONS.height;
    if (this.attachedMode === false) {
      height -= WindowManager.STATUS_BAR_HEIGHT;
    }

    this.browserWindow = new BrowserWindow({
      ...this.BROWSER_WINDOW_DEFAULTS,
      ...this.BROWSER_WINDOW_OPTIONS,
      height,
    });
    this.browserWindow.setMenuBarVisibility(false);

    if (this.debug.enabled) {
      this.debug('Launching dev tools');
      this.browserWindow.webContents.openDevTools({mode: 'detach'});
    }

    // Show and blur the main window
    this.browserWindow.once('ready-to-show', () => this.onReadyToShow());

    // On ready behavior
    this.browserWindow.webContents.once('did-finish-load', () => this.didFinishLoad());

    // Close behavior
    this.browserWindow.once('closed', () => this.whenClosed());

    // Sec: Open links in browser
    this.browserWindow.webContents.on('new-window', (event, _url) => {
      event.preventDefault();

      // Only allow HTTPS URLs to be opened in the browser
      if (_url.startsWith('https://')) {
        shell.openExternal(_url);
      }
    });

    // Sec: Prevent any kind of navigation
    // will-navigate is broken with sandboxed env, intercepting requests instead
    // see https://github.com/electron/electron/issues/8841
    this.browserWindow.webContents.session.webRequest.onBeforeRequest(
      {
        urls: ['*'],
      },
      (details, callback) => {
        // Only allow renderer document root
        const {url} = details;
        const {pathname, protocol, host} = new URL(url);

        // ToDo: Make it permanent once Electron version have Node.JS 11.X
        if (fileURLToPath) {
          // Allow web tools if debug is enabled
          if (this.debug.enabled && protocol === 'chrome-devtools:' && host === 'devtools') {
            return callback({cancel: false});
          }

          // Allow pages within the document root
          this.debug(path.resolve(fileURLToPath(url)));
          this.debug(this.RENDERER_DOCUMENT_ROOT);
          if (path.resolve(fileURLToPath(url)).startsWith(this.RENDERER_DOCUMENT_ROOT)) {
            return callback({cancel: false});
          }

          // Anything below will close the window with
          callback({cancel: true});
          if (this.browserWindow) {
            this.debug('Forbidden URL requested: %s, closing window.', pathname);
            this.browserWindow.close();
          }
        } else {
          return callback({cancel: false});
        }
      }
    );
  }

  public show(): void {
    // Inject resize event for this window only
    ipcMain.on('resize', (event, newSize: WindowSizeInterface) => {
      if (typeof this.browserWindow === 'undefined' || typeof newSize !== 'object') {
        return;
      }

      // Fix height
      newSize.height -= WindowManager.STATUS_BAR_HEIGHT;

      const currentBounds = this.browserWindow.getBounds();
      const width = newSize.width || currentBounds.width;
      const height = newSize.height || currentBounds.height;
      this.browserWindow.setBounds(
        {
          height,
          width,
          x: currentBounds.x,
          y: currentBounds.y,
        },
        this.mainWindow ? true : false
      );

      if (typeof this.mainWindow === 'undefined') {
        this.browserWindow.center();
      }
    });

    // Load the renderer
    if (typeof this.browserWindow === 'undefined') {
      this.debug(`Cannot show browser window if it's destroyed`);
      return;
    }
    this.browserWindow.loadURL(`file://${this.RENDERER_HTML}`);
  }

  public getPromptWindow(): Electron.BrowserWindow | undefined {
    return typeof this.browserWindow !== 'undefined' ? this.browserWindow : undefined;
  }

  protected signalRenderer(data?: {}): void {
    if (typeof this.browserWindow === 'undefined') {
      throw new Error(`Cannot dispatch data to browser window if it's destroyed`);
    }
    this.browserWindow.webContents.send('onDataReceived', {component: this.constructor.name, props: data});
  }
}
