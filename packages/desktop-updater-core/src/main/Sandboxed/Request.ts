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

import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';

declare const Options: AxiosRequestConfig;

// Using streams as workaround https://github.com/axios/axios/issues/928

export interface ProgressInterface {
  elapsed: number;
  percent: number;
  remaining: number;
  speed: number; // bytes
  startedAt: number;
  total?: number;
  transferred: number;
}

class Request {
  private static readonly progress: ProgressInterface = {
    elapsed: 0,
    percent: 0,
    remaining: 0,
    speed: 0,
    startedAt: 0,
    total: undefined,
    transferred: 0,
  };

  public static async do(): Promise<any> {
    const buffers: Buffer[] = [];

    let response: AxiosResponse;
    try {
      response = await axios.request({...Options, responseType: 'stream'});
    } catch (stack) {
      return new Error(stack);
    }

    this.progress.startedAt = Date.now();
    this.progress.total = Number(response.headers['content-length']) || undefined;

    return new Promise(resolve => {
      try {
        response.data
          .on(
            'data',
            typeof Options.onDownloadProgress === 'undefined'
              ? buffer => buffers.push(buffer)
              : buffer => {
                  buffers.push(buffer);
                  this.calculateProgress(buffer.length);
                }
          )
          .once('end', () => {
            const buffer = Buffer.concat(buffers);
            if (response.status !== 200) {
              throw new Error(`Request: An unknown error happened. Error status: ${response.status}.`);
            }
            resolve({...response, data: buffer});
          });
      } catch (stack) {
        resolve(new Error(stack));
      }
    });
  }

  private static calculateProgress(bufferLength: number) {
    this.progress.transferred += bufferLength;
    this.progress.elapsed = (Date.now() - this.progress.startedAt) / 1000;

    // Calculate speed
    if (this.progress.elapsed >= 1) {
      this.progress.speed = this.progress.transferred / this.progress.elapsed;
    }

    if (typeof this.progress.total !== 'undefined') {
      // Calculate percentage
      this.progress.percent = Math.min(this.progress.transferred, this.progress.total) / this.progress.total;

      if (this.progress.speed != null) {
        const remaining =
          this.progress.percent !== 1 ? this.progress.total / this.progress.speed - this.progress.elapsed : 0;

        // Round to 4 decimals
        this.progress.remaining = Math.round(remaining * 1000) / 1000;
      }
    }

    if (typeof Options.onDownloadProgress !== 'undefined') {
      Options.onDownloadProgress(this.progress);
    }
  }
}

module.exports = async (callback: Function) => callback(await Request.do());
