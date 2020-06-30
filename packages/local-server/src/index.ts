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

import debug from 'debug';
import {app, session} from 'electron';
import * as fs from 'fs';
import * as sodium from 'libsodium-wrappers';
import * as path from 'path';
import {URL} from 'url';
import {NodeVM as VirtualMachine} from 'vm2';
import {Config} from './Config';
import {InterceptProtocol as proxifyProtocol} from './Networking';
import {LocalServer as LocalServerChild} from './Server';

import {BaseError} from 'make-error-cause';
export class NotExistingError extends BaseError {}

export interface ServerConstructorInterface {
  intercept: string;
  documentRoot: string;
}

export class Server {
  private static readonly debug = debug('wire:server');

  private static readonly WEB_SERVER_TOKEN_NAME = Config.Server.WEB_SERVER_TOKEN_NAME;

  private accessToken: string | undefined;
  private internalHost: URL | undefined;
  private readonly interceptBaseUrl: URL;
  private readonly interceptBaseUrlPlain: string;
  private readonly documentRoot: string;

  constructor(options: ServerConstructorInterface) {
    this.interceptBaseUrl = new URL(options.intercept);
    this.interceptBaseUrlPlain = options.intercept;
    this.documentRoot = options.documentRoot;
  }

  public async attachTo(browserWindow: Electron.BrowserWindow): Promise<void> {
    if (this.isServerEnabled()) {
      throw new Error('Server is already active');
    }

    if (typeof this.interceptBaseUrl === 'undefined') {
      throw new Error('Environment URL must be available');
    }

    if (!Server.WEB_SERVER_TOKEN_NAME.match(/^[a-zA-Z0-9]*$/)) {
      throw new Error('Token name must be alphanumeric');
    }

    // Note: We must wait the app to be ready first
    await app.whenReady();
    Server.debug('Webapp url is %s', this.interceptBaseUrl.toString());

    // Start the server inside a VM
    await this.createWebInstance(this.documentRoot);

    // Modify the webviews in order to accept the custom protocol
    browserWindow.webContents.on('will-attach-webview', async (_event, webPreferences, params) => {
      if (params.src.startsWith(`${this.interceptBaseUrl.origin}/`) && this.isServerEnabled()) {
        Server.debug('New webapp webview detected, intercept ...');
        const ses = session.fromPartition(params.partition);

        await this.hookSessionSettingsToElectron(ses);
        webPreferences.session = ses;
      }
    });
  }

  private async createWebInstance(documentRoot: string): Promise<LocalServerChild.Child> {
    // Generate the credentials that will be used to validate HTTPS requests
    this.accessToken = await this.generateToken();
    if (typeof this.accessToken === 'undefined') {
      throw new Error('Access token not available');
    }

    Server.debug('Starting VM...');
    const sandbox = new Sandbox(path.resolve(__dirname, 'Server.js'), {
      AccessToken: this.accessToken,
      Config: Config.Server,
      DocumentRoot: documentRoot,
    });
    const {internalHost, server} = await sandbox.run();

    // Set internal host
    this.internalHost = new URL(internalHost);
    Server.debug('Internal host is: %o', this.internalHost.origin);

    return server;
  }

  private async hookSessionSettingsToElectron(ses: Electron.Session): Promise<void> {
    try {
      await proxifyProtocol(
        ses,
        this.internalHost,
        this.accessToken,
        this.interceptBaseUrlPlain,
        this.interceptBaseUrl,
      );
    } catch (error) {
      Server.debug('Unable to intercept protocol of a session, exiting the app. Error: %s', error);
      process.exit(1);
    }
  }

  private isServerEnabled(): boolean {
    return typeof this.accessToken !== 'undefined' && typeof this.internalHost !== 'undefined';
  }

  private async generateToken(): Promise<string> {
    await sodium.ready;
    return sodium.randombytes_buf(128, 'base64');
  }

  public static isPathAllowed(providedPath: fs.PathLike, allowedPath: string): boolean {
    return path.normalize(providedPath.toString()).startsWith(allowedPath);
  }
}

export class Sandbox {
  private static readonly debug = debug('wire:server:sandbox');
  private vm: VirtualMachine | undefined;

  constructor(
    private readonly filename: string,
    private readonly options: {
      AccessToken: string;
      Config: {[key: string]: any};
      DocumentRoot: string;
    },
  ) {}

  public run(): Promise<{internalHost: string; server: LocalServerChild.Child}> {
    return new Promise(async (resolve, reject) => {
      const DocumentRoot = this.options.DocumentRoot;

      this.vm = new VirtualMachine({
        require: {
          builtin: ['path', 'https', 'url'],
          context: 'host',
          external: ['finalhandler', 'serve-static', 'random-js'],
          mock: {
            fs: {
              /**
               * Mock for fs.createReadStream
               * Returns a new ReadStream object.
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
                  | undefined,
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
                callback: (err: NodeJS.ErrnoException | null, stats: fs.Stats | null) => void,
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
          // ToDo: Until folder where the node_modules is known, disable root folder restrictions
          // root: path.resolve(__dirname, './'),
        },
      });

      // Pass the options to the VM
      for (const prop in this.options) {
        this.vm.freeze(this.options[prop], prop);
      }

      Sandbox.debug('Lauching VM... (2)');
      try {
        const fileContent = await fs.promises.readFile(this.filename, {encoding: 'utf8'});
        const callback = this.vm.run(fileContent, this.filename);

        // VM callback
        callback.default(internalHost => resolve(internalHost));
      } catch (error) {
        Sandbox.debug(error);
        return reject(error);
      }
    });
  }
}
