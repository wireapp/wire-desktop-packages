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

import * as https from 'https';
import * as zlib from 'zlib';

import debug from 'debug';
import {BaseError} from 'make-error-cause';
import {throttle} from 'throttle-debounce';

import {ProgressInterface} from '@wireapp/desktop-updater-spec';
import {AxiosRequestConfig, AxiosResponse} from 'axios';
import {Config} from './Config';
import {Protobuf} from './Protobuf';
import {Sandbox} from './Sandbox';
import {Updater} from './Updater';
import {Verifier} from './Verifier';

export class DownloadError extends BaseError {}

/**
 * The downloader is protected against:
 *
 * [X] Arbitrary installation attacks (manifest is signed).
 *
 * [X] Endless data attacks (via `fileContentLength`).
 *
 * [X] Extraneous dependencies attacks (asar is one read-only file).
 *
 * [X] Fast-forward attacks (manifest is checked upon launch).
 *
 * [X] Indefinite freeze attacks (via expiresOn)
 *
 * [X] Malicious mirrors preventing updates (file can be retrieved directly from the
 * server if it fails).
 *
 * [X] Mix-and-match attacks (not applicable)
 *
 * [X] Rollback attacks (via `versionNumber`)
 *
 * [X] Slow retrieval attacks (timeout will be set in `download()` and will inform the
 * UI in case it fails or times out to download).
 *
 * [X] Vulnerability to key compromises (via deploying new wrapper updates)
 *
 * [X] Wrong software installation
 *
 * @see https://github.com/theupdateframework/tuf/blob/40289f0b5501631d35fc6e05c5233ee91d58e8a7/docs/SECURITY.md
 */

export class Downloader {
  private static readonly CIPHERS: string = Config.Downloader.CIPHERS;
  private static readonly MANIFEST_FILE: string = Config.Updater.MANIFEST_FILE;
  private static readonly MAX_CONTENT_LENGTH: number = Config.Downloader.MAX_CONTENT_LENGTH;
  private static readonly PINNING_CERTIFICATE: string = Config.Downloader.PINNING_CERTIFICATE;
  private static readonly TIMEOUT: number = Config.Downloader.TIMEOUT;
  private static readonly UPDATE_SPEC: string = Config.Downloader.UPDATE_SPEC;
  private static readonly USER_AGENT: string = Config.Downloader.USER_AGENT;

  private static readonly debug: typeof debug = debug('wire:updater:downloader');

  public static updatesEndpoint?: string;

  /**
   * Default configuration
   */
  private static readonly requestConfig: AxiosRequestConfig = {
    headers: {
      'User-Agent': Downloader.USER_AGENT,
    },
    httpsAgent: new https.Agent({
      cert: Downloader.PINNING_CERTIFICATE,
      ciphers: Downloader.CIPHERS,
      rejectUnauthorized: true,
      secureProtocol: 'TLSv1_2_method',
    }),
    maxContentLength: Downloader.MAX_CONTENT_LENGTH,
    maxRedirects: 0,
    method: 'get',
    responseType: 'arraybuffer',
    timeout: Downloader.TIMEOUT,
  };

  private static async doRequest(options: AxiosRequestConfig): Promise<AxiosResponse> {
    // Get the right endpoint according to the current environment
    if (!Downloader.updatesEndpoint) {
      throw new Error('Endpoint has not been set');
    }
    const baseURL = Downloader.updatesEndpoint;
    this.debug('Downloading content at: %s', `${baseURL}/${options.url}`);
    return new Sandbox('Request').run(
      {
        Options: {
          ...this.requestConfig,
          ...options,
          baseURL,
        },
      },
      {
        require: {
          // Full sandbox cannot be enabled with Axios
          context: 'host',
          external: ['axios'],
          root: '../',
        },
      }
    );
  }

  private static decompressBinary(compressedData: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressedData, (error, data) => {
        if (error) {
          return reject(new DownloadError('Unable to decompress the bundle', error));
        }
        resolve(data);
      });
    });
  }

  public static async getBinary(
    checksum: Buffer,
    checksumCompressed: Buffer,
    fileName: string,
    onDownloadProgress: Function = (progressEvent: ProgressInterface) => {}
  ): Promise<Buffer> {
    try {
      const throttledOnDownloadProgress = throttle(50, (progressEvent: ProgressInterface) => {
        this.debug('onDownloadProgress called');
        onDownloadProgress(progressEvent);
      });
      const {data} = await this.doRequest({
        onDownloadProgress: (progressEvent: ProgressInterface) => {
          if (progressEvent.percent === 1 && progressEvent.remaining === 0) {
            // Signal when installation is finished regardless of the throttling
            return onDownloadProgress(progressEvent);
          }
          throttledOnDownloadProgress(progressEvent);
        },
        url: fileName,
      });
      this.debug('onDownloadProgress finished and cancelled');
      throttledOnDownloadProgress.cancel();

      // Verify file integrity of the compressed file
      await Verifier.verifyFileIntegrity(data, checksumCompressed);

      // Decompress the file
      const dataDecompressed = await this.decompressBinary(data);

      // Verify file integrity of the file
      await Verifier.verifyFileIntegrity(dataDecompressed, checksum);

      return dataDecompressed;
    } catch (error) {
      throw new DownloadError(error.message, error);
    }
  }

  /*
   * Get latest manifest from the web server
   *
   * Verify the authenticity of the envelope otherwise throw Error on failure
   */
  public static async getLatestEnvelope(): Promise<Updater.Envelope> {
    let envelope: Buffer;
    try {
      const response = await this.doRequest({url: Downloader.MANIFEST_FILE});
      envelope = response.data;
    } catch (error) {
      throw new DownloadError(error.message, error);
    }

    return this.extractEnvelopeFrom(envelope);
  }

  public static async extractEnvelopeFrom(raw: Buffer): Promise<Updater.Envelope> {
    // Decode envelope
    const root = await Protobuf.loadRoot(Downloader.UPDATE_SPEC);
    const {data, publicKey, signature} = <Updater.Envelope>await Protobuf.decodeBuffer(root, 'UpdateMessage', raw);

    return {data, publicKey, signature, raw};
  }

  public static async extractManifestFrom(envelope: Updater.Envelope): Promise<Updater.Manifest> {
    const root = await Protobuf.loadRoot(Downloader.UPDATE_SPEC);

    // Unserialize manifest
    return <Updater.Manifest>(<unknown>Protobuf.decodeBuffer(root, 'UpdateData', envelope.data));
  }
}
