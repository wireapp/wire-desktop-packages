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

import * as fs from 'fs-extra';

import {
  BridgeIPC,
  Decision as SpecDecision,
  Envelope as SpecEnvelope,
  Manifest as SpecManifest,
} from '@wireapp/desktop-updater-spec';
import debug from 'debug';
import * as Random from 'random-js';

import {app, ipcMain} from 'electron';
import {Config} from './Config';
import {DiskPersistence as Persist} from './DiskPersistence';
import {Downloader} from './Downloader';
import {Environment} from './Environment';
import {ErrorDispatcher, ErrorDispatcherResponseInterface} from './ErrorDispatcher';
import {Installer} from './Installer';
import {getLocales} from './Localization';
import {Prompt} from './Prompt';
import {Utils} from './Utils';
import {BlacklistedVersionError, Verifier, VerifyExpirationError} from './Verifier';
import {WrapperOutdated} from './WrapperOutdated';

import {BaseError} from 'make-error-cause';

export class LogicalError extends BaseError {}
export class NotFoundError extends BaseError {}
export class ManifestNotFoundError extends BaseError {}

export namespace Updater {
  export interface Envelope extends SpecEnvelope {}
  export interface Manifest extends SpecManifest {}
  export interface Decision extends SpecDecision {}

  export interface ContinueUpdateInterface {
    forced: boolean;
  }

  export class Main {
    private static readonly PERIODIC_INTERVAL: number = Config.Updater.PERIODIC_INTERVAL;
    private static readonly CONNECTIVITY_INTERNAL: number = Config.Updater.CONNECTIVITY_INTERNAL;
    private static readonly BROADCAST_RENDERER_TIMEOUT: number = Config.Updater.BROADCAST_RENDERER_TIMEOUT;
    private static readonly FALLBACK_WEB_VERSION: string = Config.Updater.FALLBACK_WEB_VERSION;

    public static reload?: (documentRoot: string) => {};
    public static isInternetAvailable?: (url: string) => Promise<boolean>;
    public static browserWindow?: Electron.BrowserWindow = undefined;

    private static _continueUpdate?: Function = undefined;

    private static readonly debug: typeof debug = debug('wire:updater');
    private static readonly persist = new Persist(Utils.resolvePath(Config.Updater.SETTINGS_FILE));

    private static PERIODIC_TIMER?: NodeJS.Timer;
    private static isBusy: boolean = false;

    public static connectivityCheckEndpoints: string[];
    public static currentClientVersion: string;
    public static currentEnvironment: string;
    public static currentWebappEnvironment: string;
    public static currentWebappVersion?: string;
    public static trustStore: string[];
    public static updatesEndpoint: string;

    public static async runOnce(
      skipNotification: boolean = false, // Means we want the prompt asap (no notifications)
      isWebappTamperedWith: boolean = false, // Pass the value from the server
      firstLaunch: boolean = false,
      // Is there an environment mismatch between local settings and local webapp?
      // If yes it's likely because we just changed our environment
      localEnvironmentMismatch: boolean = false
    ): Promise<Updater.Manifest | undefined> {
      if (this.isBusy) {
        this.debug('Skipped update check because runOnce() is already running');
        return undefined;
      }
      this.isBusy = true;
      let promptWindow: Prompt | undefined;
      let installerWindow: Installer | undefined;

      try {
        if (!this.currentClientVersion) {
          throw new LogicalError('Provided client version must be set.');
        }
        if (typeof this.currentClientVersion !== 'string') {
          throw new LogicalError('Provided client version must be a string.');
        }

        if (!this.currentEnvironment) {
          throw new LogicalError('Provided environment must be set.');
        }
        if (typeof this.currentEnvironment !== 'string') {
          throw new LogicalError('Provided environment must be a string.');
        }
        await Environment.set(this.currentEnvironment);

        if (this.trustStore === undefined || this.trustStore.length == 0) {
          throw new LogicalError('Trust store is either not set or empty.');
        }

        if (!this.updatesEndpoint) {
          throw new LogicalError('Provided updates endpoint must be set.');
        }
        if (typeof this.updatesEndpoint !== 'string') {
          throw new LogicalError('Updates endpoint must be a string.');
        }
        Downloader.updatesEndpoint = this.updatesEndpoint;

        if (typeof this.currentWebappVersion === 'undefined') {
          // Version was never set (bundle missing?), use old date to trigger blacklisting
          this.currentWebappVersion = Main.FALLBACK_WEB_VERSION;
          this.currentWebappEnvironment = await Environment.get();
        }

        this.debug('Client version: %s', this.currentClientVersion);
        this.debug('Webapp version: %s', this.currentWebappVersion);

        this.debug('Checking if internet is available...');
        if (typeof this.isInternetAvailable === 'undefined') {
          throw new LogicalError('Internet connectivity function must be set.');
        }
        while (true) {
          if (await this.isInternetAvailable(Random.pick(Random.nodeCrypto, this.connectivityCheckEndpoints))) {
            break;
          }

          this.debug('Internet seems offline, retrying...');
          await Utils.sleep(Updater.Main.CONNECTIVITY_INTERNAL);
        }

        // Get remote manifest
        this.debug('Getting latest manifest...');
        const envelope: Updater.Envelope = await Downloader.getLatestEnvelope();

        // Check integrity
        await Verifier.ensurePublicKeyIsTrusted(envelope.publicKey, this.trustStore);
        await Verifier.verifyEnvelopeIntegrity(envelope.data, envelope.signature, envelope.publicKey);

        // Extract manifest
        const manifest: Updater.Manifest = await Downloader.extractManifestFrom(envelope);
        const fileName: string = Utils.getFilenameFromChecksum(manifest.fileChecksum);

        // Sanity checks
        this.debug('Verifying manifest...');
        let isWebappBlacklisted: boolean = false;
        let isClientBlacklisted: boolean = false;
        try {
          await Verifier.verifyManifest(
            manifest,
            this.currentWebappVersion,
            this.currentWebappEnvironment,
            this.currentClientVersion
          );
        } catch (error) {
          if (error instanceof BlacklistedVersionError) {
            switch (error.message) {
              case Verifier.OUTDATED.WRAPPER:
                this.debug('This wrapper version is blacklisted');
                isClientBlacklisted = true;
                break;

              case Verifier.OUTDATED.WEBAPP:
                this.debug('Current webapp version is blacklisted');
                isWebappBlacklisted = true;
                break;
            }
          } else {
            throw error;
          }
        }

        // Do we need to install this update?
        if (manifest.webappVersionNumber === this.currentWebappVersion && localEnvironmentMismatch === false) {
          // The latest version is installed
          this.debug('No updates available');
          return undefined;
        }

        if (!skipNotification) {
          // Update has been deployed while the app is running
          // Wait for user to click on update

          // Fire notification only if Wire is already launched
          this.debug('Display notification about the update...');
          await Utils.displayNotification(
            {
              actions: [
                {
                  text: await getLocales('updater:newUpdateAvailableDetails'),
                  type: 'button',
                },
              ],
              body: await getLocales('updater:newUpdateAvailableBody'),
              title: await getLocales('updater:newUpdateAvailableTitle'),
            },
            async (type: string, event: Event, index?: number) => {
              if (this.browserWindow) {
                this.browserWindow.focus();
              }

              // Bypass broadcastUpdateToRenderer
              await this.continueUpdate({forced: false});
            }
          );

          // Send message to renderer so it knows there is an update
          // Get a reply to confirm that the renderer acknowledged to receive the message
          // Set a timeout, shows a prompt if it expires
          this.debug('This is not the first launch, assuming the webapp is running');
          await this.broadcastUpdateToRenderer();
        }

        // Handle client blacklist message
        if (isClientBlacklisted) {
          await this.showWrapperOutdatedWindow();
          return undefined;
        }

        // If automatic mode is set and the prompt is attached to the main window, do not prompt the user
        let decision: Decision;
        const isUpdatesInstallAutomatically: boolean = await Main.persist.get('installAutomatically', false);
        const isAttachedToBrowserWindow: boolean = typeof this.browserWindow !== 'undefined';
        if (isUpdatesInstallAutomatically && isAttachedToBrowserWindow) {
          decision = {
            allow: true,
            installAutomatically: true,
          };
        } else if (localEnvironmentMismatch === true) {
          this.debug('Environment switching detected, immediately reinstalling the update after restarting the app...');
          decision = {
            allow: true,
            installAutomatically: true,
          };
        } else {
          this.debug('Prompt the user about the update');
          promptWindow = new Prompt(
            this.browserWindow,
            manifest,
            envelope,
            this.currentWebappVersion,
            isWebappBlacklisted,
            isWebappTamperedWith,
            isUpdatesInstallAutomatically
          );
          decision = await promptWindow.show();
          if (decision.allow === false) {
            this.debug('User declined the update');
            if (isWebappBlacklisted) {
              app.quit();
            }
            return undefined;
          }
        }

        // Save settings related to the popup
        await Main.persist.set('installAutomatically', decision.installAutomatically);
        await Main.persist.saveChangesOnDisk();

        this.debug('Launching installer window');
        installerWindow = new Installer(this.browserWindow);
        await installerWindow.show();

        // Download and verify bundle
        this.debug('Downloading/decompressing file');
        const file: Buffer = await Downloader.getBinary(
          manifest.fileChecksum,
          manifest.fileChecksumCompressed,
          fileName,
          progressEvent => (installerWindow ? installerWindow.onDownloadProgress(progressEvent) : undefined)
        );

        this.debug('Installing updated bundle and manifest');
        await Installer.save(fileName, file, envelope.raw);

        // Reload the web server
        // If reload is not set then no web server was running
        if (typeof this.reload !== 'undefined') {
          await this.reload(await Utils.getDocumentRoot(manifest.fileChecksum));
        }

        // Set new webapp version
        this.currentWebappVersion = manifest.webappVersionNumber;
        this.currentWebappEnvironment = manifest.targetEnvironment;

        await installerWindow.close();

        return manifest;
      } catch (error) {
        // Build error
        if (promptWindow) {
          ErrorDispatcher.promptWindow = promptWindow.getPromptWindow();
        }
        if (installerWindow) {
          ErrorDispatcher.installerWindow = installerWindow.getPromptWindow();
        }
        ErrorDispatcher.error = error;

        const response: ErrorDispatcherResponseInterface = await ErrorDispatcher.dispatch();
        if (response.tryAgain === true) {
          this.debug('Trying to check for updates one more time...');

          // Make the function free again so we can call it one more time
          this.isBusy = false;
          return await this.runOnce(skipNotification, isWebappTamperedWith, firstLaunch);
        } else {
          return undefined;
        }
      } finally {
        this.debug('End of runOnce');
        this.isBusy = false;
      }
    }

    private static clearPeriodicTimer(): void {
      if (Main.PERIODIC_TIMER) {
        clearInterval(Main.PERIODIC_TIMER);
        Main.PERIODIC_TIMER = undefined;
      }
    }

    public static async runPeriodic(): Promise<void> {
      if (Main.PERIODIC_TIMER) {
        this.clearPeriodicTimer();
      }

      // Listen for clicks on the update bar
      ipcMain.on(BridgeIPC.UPDATE_AVAILABLE_DISPLAY, async channel => {
        this.debug('User clicked on the update bar, showing the window.');
        if ((await this.continueUpdate({forced: false})) === false) {
          this.debug('Unable to show the window, running a skipNotification check instead...');
          // Do a new check since continuing the update is not possible (runOnce ended)
          await this.runOnce(true);
        }
      });

      Main.PERIODIC_TIMER = setInterval(async () => {
        this.debug('Checking updates...');
        await this.runOnce();
      }, Main.PERIODIC_INTERVAL);

      // Run for the first time
      setImmediate(async () => {
        await this.runOnce(true, false, true);
      });
    }

    private static async continueUpdate(data: Updater.ContinueUpdateInterface): Promise<boolean> {
      if (typeof this._continueUpdate === 'undefined') {
        return false;
      }

      await this._continueUpdate(data);
      this._continueUpdate = undefined;
      return true;
    }

    private static broadcastUpdateToRenderer(): Promise<Updater.ContinueUpdateInterface> {
      return new Promise(resolve => {
        this._continueUpdate = resolve;

        // Set a timeout to force app show
        const timeoutBeforeShowingPrompt = setTimeout(() => {
          this.debug('Timeout expired (to show the update within the webapp), showing update anyway.');
          resolve({forced: true});
        }, Main.BROADCAST_RENDERER_TIMEOUT);

        // Dispatch event to renderer
        if (this.browserWindow) {
          ipcMain.once(BridgeIPC.UPDATE_AVAILABLE_ACK, channel => {
            clearTimeout(timeoutBeforeShowingPrompt);
            this.debug('Renderer acknowledged receiving data, cancelling the timeout.');
          });
          this.browserWindow.webContents.send(BridgeIPC.UPDATE_AVAILABLE);
        }
      });
    }

    private static async showWrapperOutdatedWindow(): Promise<void> {
      // Wrapper blacklist logic
      this.debug('Wrapper is blacklisted, showing window');
      const wrapperOutdated = new WrapperOutdated(this.browserWindow);

      // Disable periodic checks
      if (Main.PERIODIC_TIMER) {
        this.clearPeriodicTimer();
      }

      await wrapperOutdated.show();
    }

    public static async getLocalVersion(
      currentClientVersion: string,
      trustStore: string[]
    ): Promise<Partial<Updater.Manifest>> {
      // Check if manifest file exist locally
      const manifestFile = Utils.resolvePath(Config.Updater.MANIFEST_FILE);
      if ((await fs.pathExists(manifestFile)) === false) {
        throw new ManifestNotFoundError('Could not find manifest file');
      }

      // Read manifest file
      const envelope = await Downloader.extractEnvelopeFrom(await Utils.readFileAsBuffer(manifestFile));

      // Extract manifest
      // Manifest is extracted before integrity check only locally (in order to get the environment)
      const manifest: Updater.Manifest = await Downloader.extractManifestFrom(envelope);

      // Locally, use the same environment
      const environment = manifest.targetEnvironment;
      this.debug('Extracted "%s" environment from local manifest', environment);

      // Check integrity of manifest
      await Verifier.ensurePublicKeyIsTrusted(envelope.publicKey, trustStore, environment);
      await Verifier.verifyEnvelopeIntegrity(envelope.data, envelope.signature, envelope.publicKey);

      // Verify manifest
      try {
        await Verifier.verifyManifest(
          manifest,
          manifest.webappVersionNumber,
          manifest.targetEnvironment,
          currentClientVersion
        );
      } catch (error) {
        if (error instanceof VerifyExpirationError) {
          // Accept expired manifest since we already installed it
          // The blacklisting mechanism will take care of expiring this version
          this.debug(`Update is expired but continuing since it's stored locally`);
        } else {
          throw error;
        }
      }

      // Build document root path
      let documentRoot: string;
      let bundle: Buffer;
      try {
        documentRoot = await Utils.getDocumentRoot(manifest.fileChecksum);
        bundle = await Utils.readFileAsBuffer(documentRoot, true);
      } catch (error) {
        throw new NotFoundError('Could not find the bundle', error);
      }

      // Verify file integrity
      await Verifier.verifyFileIntegrity(bundle, manifest.fileChecksum);

      return manifest;
    }
  }
}
