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
import {BrowserWindow, app, ipcMain, session} from 'electron';
import * as path from 'path';
import {URL, fileURLToPath} from 'url';
import {Utils} from './Utils';

export interface WindowSizeInterface {
  height: number;
  width: number;
}

export abstract class WindowManager {
  private readonly WINDOW_TYPE = this.constructor.name;
  protected static readonly SESSION_NAME: string = 'zupdater';

  protected readonly debug = debug(`wire:updater:${this.constructor.name.toLowerCase()}`);

  constructor(protected mainWindow?: Electron.BrowserWindow) {}

  protected browserWindow?: Electron.BrowserWindow;
  public abstract get BROWSER_WINDOW_OPTIONS(): () => Promise<Partial<Electron.BrowserWindowConstructorOptions>>;

  private readonly attachedMode = typeof this.mainWindow !== 'undefined';
  private readonly IS_MACOS = process.platform === 'darwin';
  private readonly RENDERER_DOCUMENT_ROOT = path.join(
    path.dirname(require.resolve('@wireapp/desktop-updater-ui')),
    '../../',
  );
  protected readonly RENDERER_HTML = path.join(this.RENDERER_DOCUMENT_ROOT, '.renderer/index.html');
  protected readonly RENDERER_PRELOAD = path.join(__dirname, `Preloads/${this.WINDOW_TYPE}.js`);
  private readonly BROWSER_WINDOW_DEFAULTS: Electron.BrowserWindowConstructorOptions = {
    backgroundColor: this.IS_MACOS ? undefined : '#f7f8fa',
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
    useContentSize: true,
    vibrancy: this.IS_MACOS ? 'menu' : undefined,
    webPreferences: {
      allowRunningInsecureContent: false,
      backgroundThrottling: false,
      contextIsolation: true,
      enableRemoteModule: false,
      javascript: true,
      nativeWindowOpen: false,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      plugins: false,
      preload: this.RENDERER_PRELOAD,
      sandbox: true,
      scrollBounce: true,
      session: session.fromPartition(WindowManager.SESSION_NAME),
      webSecurity: true,
      webaudio: false,
      webgl: false,
      webviewTag: false,
    },
  };

  protected whenClosed(): void {
    this.debug('whenClosed called');
    ipcMain.removeAllListeners('resize');
  }

  protected didFinishLoad(): void {
    this.debug('didFinishLoad called');
  }

  public onReadyToShow(): void {
    this.debug('onReadyToShow called');
    const show = () => (this.browserWindow ? this.browserWindow.show() : null);
    if (this.attachedMode && this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.debug('mainWindow is visible');
        show();
      } else {
        this.debug('Wait for the mainWindow to be ready');
        this.mainWindow.once('show', () => show());
      }
    } else {
      show();
    }
  }

  public async prepare(): Promise<void> {
    if (typeof this.browserWindow !== 'undefined') {
      this.browserWindow.close();
      this.browserWindow.destroy();
    }

    const BROWSER_WINDOW_OPTIONS = await this.BROWSER_WINDOW_OPTIONS();

    this.browserWindow = new BrowserWindow({
      ...this.BROWSER_WINDOW_DEFAULTS,
      ...BROWSER_WINDOW_OPTIONS,
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

    // Debug
    if (this.debug.enabled) {
      this.browserWindow.webContents.on('console-message', (event, level, message) =>
        this.debug(`From WebContents: ${message}`),
      );
    }

    // Close behavior
    this.browserWindow.once('closed', () => this.whenClosed());

    // Open links in browser
    this.browserWindow.webContents.on('new-window', async (event, _url) => {
      event.preventDefault();

      // Only allow HTTPS URLs to be opened in the browser
      this.debug('New window detected, opening as external link: "%s"', _url);
      await Utils.openExternalLink(_url, true);
    });

    // Prevent any kind of navigation
    // will-navigate is broken with sandboxed env, intercepting requests instead
    // see https://github.com/electron/electron/issues/8841
    this.browserWindow.webContents.session.webRequest.onBeforeRequest(
      {
        urls: ['*'],
      },
      async (details, callback) => {
        // Only allow renderer document root
        const {url} = details;
        const {protocol, host} = new URL(url);

        // Allow web tools if debug is enabled
        if (this.debug.enabled && protocol === 'chrome-devtools:' && host === 'devtools') {
          return callback({cancel: false});
        }

        // Allow pages within the document root
        if (protocol === 'file:') {
          const filePath = path.resolve(fileURLToPath(url));
          if (filePath.startsWith(this.RENDERER_DOCUMENT_ROOT)) {
            this.debug('Allowed file URL "%s"', url);
            return callback({cancel: false});
          }
        }

        // Anything below will close the window with
        this.debug('Forbidden URL requested: "%s"', url);
        return callback({cancel: true});
      },
    );
  }

  public async show(): Promise<any> {
    // Inject resize event for this window only
    ipcMain.on('resize', (event, newSize: WindowSizeInterface) => {
      if (typeof this.browserWindow === 'undefined' || typeof newSize !== 'object') {
        return;
      }

      const currentContentSize = this.browserWindow.getContentSize();
      const width = newSize.width || currentContentSize[0];
      const height = newSize.height || currentContentSize[1];
      this.browserWindow.setContentSize(width, height, this.mainWindow ? true : false);

      if (typeof this.mainWindow === 'undefined') {
        this.browserWindow.center();
      }
    });

    // Load the renderer
    if (typeof this.browserWindow === 'undefined') {
      this.debug(`Cannot show browser window if it's destroyed`);
      return;
    }
    await this.browserWindow.loadURL(`file://${this.RENDERER_HTML}`);
  }

  public getPromptWindow(): Electron.BrowserWindow | undefined {
    return typeof this.browserWindow !== 'undefined' ? this.browserWindow : undefined;
  }

  protected signalRenderer(data?: {}): void {
    if (typeof this.browserWindow === 'undefined') {
      throw new Error(`Cannot dispatch data to browser window if it's destroyed`);
    }
    // Add translation here as well
    this.browserWindow.webContents.send('onDataReceived', {
      component: this.constructor.name,
      locale: app.getLocale(),
      props: data,
    });
  }
}
