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
import * as SetCookieParser from 'set-cookie-parser';

export class CookieManager {
  private static readonly debug: typeof debug = debug('wire:server:cookiemanager');

  private static readonly COOKIE_SEPARATOR = '; ';
  private static readonly MAX_COOKIE_LENGTH = 4096;

  private static readonly translateExpirationDate = (expires: Date | undefined) =>
    expires ? Math.round(expires.getTime() / 1000) : undefined;

  private static _set(cookieData: Electron.Details, session: Electron.Session): Promise<void> {
    CookieManager.debug('Setting a cookie', cookieData);
    return new Promise((resolve, reject) => {
      if (!cookieData.name || !cookieData.value) {
        return reject('Cookie name and value must be set');
      }

      const isMaximumBytesReached =
        Buffer.byteLength(cookieData.name, 'utf8') > CookieManager.MAX_COOKIE_LENGTH ||
        Buffer.byteLength(cookieData.value, 'utf8') > CookieManager.MAX_COOKIE_LENGTH;
      if (isMaximumBytesReached) {
        return reject('Maximum bytes for a cookie exceeded');
      }

      session.cookies.set(cookieData, error => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
  }
  private static _get(url: string, session: Electron.Session): Promise<Electron.Cookie[]> {
    return new Promise((resolve, reject) => {
      session.cookies.get({url}, (error, cookies) => {
        if (error) {
          return reject(error);
        }
        CookieManager.debug('Getting a cookie', url, cookies);
        return resolve(cookies);
      });
    });
  }

  public static async set(cookiesRaw: string[], urlRaw: string, ses: Electron.Session): Promise<void> {
    if (cookiesRaw !== undefined && cookiesRaw.length > 0) {
      CookieManager.debug('Cookies detected');
      const url = new URL(urlRaw);
      const cookies: SetCookieParser.Cookie[] = SetCookieParser.parse(cookiesRaw);

      for (const cookie of cookies) {
        const expirationDate = CookieManager.translateExpirationDate(cookie.expires);
        await CookieManager._set(
          {
            domain: cookie.domain,
            expirationDate,
            httpOnly: cookie.httpOnly ? cookie.httpOnly : false,
            name: cookie.name,
            path: cookie.path ? cookie.path : '/',
            secure: cookie.secure ? cookie.secure : false,
            url: url.origin,
            value: cookie.value,
          },
          ses
        );
      }
    }
  }

  public static async get(url: string, session: Electron.Session): Promise<string | undefined> {
    let serializedCookie = '';

    // Get all cookies related to this url
    const cookiesRaw: Electron.Cookie[] = await this._get(url, session);
    if (cookiesRaw !== undefined && cookiesRaw.length > 0) {
      for (const cookie of cookiesRaw) {
        if (cookie.name && cookie.value) {
          const {name, value} = cookie;
          serializedCookie += `${name}=${value}${CookieManager.COOKIE_SEPARATOR}`;
        }
      }
    }

    return serializedCookie === '' ? undefined : serializedCookie;
  }
}
