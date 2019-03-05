/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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

import * as fs from 'fs-extra';
import * as path from 'path';
import * as sodium from 'sodium-native';
import {URL} from 'url';

import debug from 'debug';
import {BrowserWindow, app, session, webContents} from 'electron';
import {NodeVM as VirtualMachine} from 'vm2';

import {NotFoundError, Updater} from '@wireapp/desktop-updater/dist/commonjs/Updater';
import {Utils as UpdaterUtils} from '@wireapp/desktop-updater/dist/commonjs/Utils';
import {VerifyMismatchEnvironment} from '@wireapp/desktop-updater/dist/commonjs/Verifier';

import {Updater as UpdaterChild} from './Child';
import {InterceptProtocol as proxifyProtocol} from './InterceptProtocol';

import {Config, Utils} from './index';

import {BaseError} from 'make-error-cause';
export class NotExistingError extends BaseError {}

import {Environment} from '@wireapp/desktop-updater/dist/commonjs/Environment';

export interface ServerConstructorInterface {
  browserWindowOptions: Electron.BrowserWindowConstructorOptions;
  currentClientVersion: string;
  currentEnvironment: string;
  currentEnvironmentBaseUrl: string;
  trustStore: string[];
  updatesEndpoint: string;
}

export class Server {
  private static readonly debug: typeof debug = debug('wire:server');

  private static readonly WEB_SERVER_TOKEN_NAME = Config.Server.WEB_SERVER_TOKEN_NAME;

  private accessToken: string | undefined;
  private browserWindow: Electron.BrowserWindow | undefined;
  private readonly browserWindowOptions: Electron.BrowserWindowConstructorOptions;
  private readonly currentClientVersion: string;
  private readonly currentEnvironment: string;
  private readonly currentEnvironmentBaseUrl: URL;
  private readonly currentEnvironmentBaseUrlPlain: string;
  private currentEnvironmentHostname: string | undefined;
  private internalHost: URL | undefined;
  private readonly trustStore: string[];
  private readonly updatesEndpoint: string;

  constructor(options: ServerConstructorInterface) {
    this.browserWindowOptions = options.browserWindowOptions;
    this.currentClientVersion = options.currentClientVersion;
    this.currentEnvironment = options.currentEnvironment;
    this.currentEnvironmentBaseUrl = new URL(options.currentEnvironmentBaseUrl);
    this.currentEnvironmentBaseUrlPlain = options.currentEnvironmentBaseUrl;
    this.trustStore = options.trustStore;
    this.updatesEndpoint = options.updatesEndpoint;
  }

  public async start(): Promise<Electron.BrowserWindow> {
    await Environment.set(this.currentEnvironment);

    // Ensure the updater folder exist
    UpdaterUtils.ensureUpdaterFolderExists();

    if (this.isServerAvailable()) {
      throw new Error('Server is already active, you must stop it before.');
    }

    if (typeof this.currentEnvironmentBaseUrl === 'undefined') {
      throw new Error('Environment URL must be available');
    }

    // Pass data to the updater
    Updater.Main.currentClientVersion = this.currentClientVersion;
    Updater.Main.currentEnvironment = this.currentEnvironment;
    Updater.Main.trustStore = this.trustStore;
    Updater.Main.updatesEndpoint = this.updatesEndpoint;

    // Ensure WEB_SERVER_TOKEN_NAME is alphanumeric only
    if (!Server.WEB_SERVER_TOKEN_NAME.match(/^[a-zA-Z0-9]*$/)) {
      throw new Error('Token name must be alphanumeric, aborting.');
    }

    // Wait for Electron to be ready
    await app.whenReady();

    // Retrieve current environment
    // Note: We must wait the app to be ready first
    this.currentEnvironmentHostname = Environment.convertUrlToHostname(this.currentEnvironmentBaseUrl.toString());
    Server.debug('Webapp url is %s', this.currentEnvironmentBaseUrl.toString());
    Server.debug('Webapp hostname is %s', this.currentEnvironmentHostname);

    // Note: Use --bypassSecureUpdater to bypass the server
    if (Environment.bypassSecureUpdater) {
      return new BrowserWindow({...this.browserWindowOptions});
    }

    // Create main window here
    this.browserWindow = new BrowserWindow({...this.browserWindowOptions, show: false});

    // Attempt to use local version
    let manifest;
    try {
      manifest = await Updater.Main.getLocalVersion(this.currentClientVersion, this.trustStore);
    } catch (error) {
      Server.debug('Error happened while getting local version, checking for update so the user can fix this...');
      Server.debug(error);

      const skipNotification = true;
      const isWebappTamperedWith = error instanceof NotFoundError ? false : true;
      const firstLaunch = true;
      let localEnvironmentMismatch: boolean = false;
      if (error instanceof VerifyMismatchEnvironment) {
        // Environment has been changed
        // Reinstall the web app with the correct environment
        Server.debug(`Local mismatch environment detected, continuing...`);
        localEnvironmentMismatch = true;
      }
      Server.debug('Is webapp tampered with: %s', isWebappTamperedWith);

      manifest = await Updater.Main.runOnce(
        skipNotification,
        isWebappTamperedWith,
        firstLaunch,
        localEnvironmentMismatch
      );
      if (typeof manifest === 'undefined') {
        return Promise.reject(new Error('Required update denied, server cannot be started. Exiting.'));
      }
    }

    // Build document root
    const documentRoot = UpdaterUtils.resolvePath(UpdaterUtils.getFilenameFromChecksum(manifest.fileChecksum));

    // Start the server inside a VM
    let server: UpdaterChild.Child = await this.createWebInstance(documentRoot);

    // Modify the webviews in order to accept the custom protocol
    this.browserWindow.webContents.on('will-attach-webview', async (event, webPreferences, params) => {
      if (params.src.startsWith(`${this.currentEnvironmentHostname}/`)) {
        Server.debug('New webapp webview detected, allowing Electron to perform normally inside...');
        const ses = session.fromPartition(params.partition);

        this.hookSessionSettingsToElectron(ses);
        webPreferences.session = ses;
      }
    });

    // Bind reload function from updater to this class
    Updater.Main.reload = async (filename: string): Promise<void> => {
      const documentRoot = UpdaterUtils.resolvePath(filename);
      Server.debug('Change of the document root requested, new one is %s', documentRoot);

      // Stop the server
      if (server) {
        await server.stop();
      }

      // Overwrite  the old web server instance with a new one
      server = await this.createWebInstance(documentRoot);

      // Refresh webviews with new settings
      if (this.browserWindow) {
        for (const wc of webContents.getAllWebContents()) {
          // Check if the webcontent we got belong one of our webviews in the browser window
          if (wc.hostWebContents && wc.hostWebContents.id === this.browserWindow.webContents.id) {
            const historyLastItem = (<any>wc).history[0];
            if (historyLastItem.startsWith(`${this.currentEnvironmentHostname}/`)) {
              // Reinject session settings and reload the webview
              this.hookSessionSettingsToElectron(wc.session);
              wc.reload();
            }
          }
        }
      }
    };

    // Link Updater to the main window
    Updater.Main.browserWindow = this.browserWindow;

    // Set webapp version / environment
    Server.debug('Running Updater checks...');
    Updater.Main.currentWebappVersion = manifest.webappVersionNumber;
    Updater.Main.currentWebappEnvironment = manifest.targetEnvironment;
    Updater.Main.runPeriodic();

    // If originally the window was shown by default, show it now
    if (this.browserWindowOptions.show === true) {
      this.browserWindow.show();
    }

    return this.browserWindow;
  }

  private async createWebInstance(documentRoot: string): Promise<UpdaterChild.Child> {
    try {
      // Generate the credentials that will be used to validate HTTPS requests
      this.accessToken = await this.generateToken();
      if (typeof this.accessToken === 'undefined') {
        throw new Error('Access token not available');
      }
      Server.debug('Running VM...');
      const sandbox = new Sandbox(path.resolve(__dirname, 'Child.js'), {
        AccessToken: this.accessToken,
        Config: Config.Server,
        DocumentRoot: documentRoot,
      });
      const {internalHost, server} = await sandbox.run();

      // Set internal host
      this.internalHost = new URL(internalHost);
      Server.debug('Internal host is: %o', this.internalHost);

      return server;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private hookSessionSettingsToElectron(ses: Electron.Session) {
    proxifyProtocol(
      ses,
      this.internalHost,
      this.accessToken,
      this.currentEnvironmentBaseUrlPlain,
      this.currentEnvironmentBaseUrl
    );
  }

  private isServerAvailable(): boolean {
    return typeof this.accessToken !== 'undefined' && typeof this.internalHost !== 'undefined';
  }

  private async generateToken(): Promise<string> {
    const token = Buffer.alloc(128);
    sodium.randombytes_buf(token);
    return token.toString('base64');
  }

  public static isPathAllowed(providedPath: fs.PathLike, allowedPath: string) {
    return path.normalize(providedPath.toString()).startsWith(allowedPath);
  }
}

export class Sandbox {
  private static readonly debug: typeof debug = debug('wire:server:sandbox');
  private vm: VirtualMachine | undefined;

  constructor(
    private readonly filename: string,
    private readonly options: {
      AccessToken: string;
      Config: {};
      DocumentRoot: string;
    }
  ) {}

  public run(): Promise<{internalHost: string; server: UpdaterChild.Child}> {
    return new Promise(async (resolve, reject) => {
      const DocumentRoot = this.options.DocumentRoot;

      this.vm = new VirtualMachine({
        require: {
          builtin: ['path', 'https'],
          context: 'host',
          external: ['finalhandler', 'serve-static'],
          mock: {
            fs: {
              /**
               * Mock for fs.createReadStream
               * Returns a new ReadStream object.
               *
               * @param path
               * @param options
               */
              createReadStream(
                fsPath: fs.PathLike,
                options?:
                  | string
                  | {
                      flags?: string | undefined;
                      encoding?: string | undefined;
                      fd?: number | undefined;
                      mode?: number | undefined;
                      autoClose?: boolean | undefined;
                      start?: number | undefined;
                      end?: number | undefined;
                    }
                  | undefined
              ): fs.ReadStream | undefined {
                // Ensure requested path is within the document root
                if (!path.normalize(fsPath.toString()).startsWith(DocumentRoot)) {
                  const message = `Access denied. Path: ${path.toString()}`;
                  Sandbox.debug(message);
                  return undefined;
                }
                Sandbox.debug('Allowing read for %s', fsPath);
                return fs.createReadStream(fsPath, options);
              },
              /**
               * Mock for fs.stat
               *
               * @param path
               * @param callback
               */
              stat(
                fsPath: string | Buffer,
                callback: (err: NodeJS.ErrnoException, stats: any /* fs.Stats */) => void
              ): void {
                // Ensure requested path is within the document root
                if (!path.normalize(fsPath.toString()).startsWith(DocumentRoot)) {
                  const message = `Access denied. Path: ${path.toString()}`;
                  if (typeof callback === 'function') {
                    callback(new Error(message), null);
                  }
                  return;
                }
                Sandbox.debug('Allowing stat for %s', fsPath);
                return fs.stat(fsPath, callback);
              },
            },
          },
          root: './',
        },
      });

      // Pass the options to the VM
      for (const prop in this.options) {
        this.vm.freeze(this.options[prop], prop);
      }

      Sandbox.debug('Lauching VM... (2)');
      try {
        const callback = this.vm.run(await Utils.readFileAsString(this.filename), this.filename);

        // VM callback
        callback.default(internalHost => resolve(internalHost));
      } catch (error) {
        Sandbox.debug(error);
        return reject(error);
      }
    });
  }
}
