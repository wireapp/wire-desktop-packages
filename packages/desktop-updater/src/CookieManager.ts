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
import {URL} from 'url';

export class CookieManager {
  private static readonly debug = debug('wire:server:cookiemanager');

  private static readonly COOKIE_SEPARATOR = '; ';
  private static readonly MAX_COOKIE_LENGTH = 4096;

  private static readonly translateExpirationDate = (expires: Date | undefined) =>
    expires ? Math.round(expires.getTime() / 1000) : undefined;

  private static async _set(cookieData: Electron.Details, session: Electron.Session): Promise<void> {
    if (!cookieData.name || !cookieData.value) {
      throw new Error('Cookie name and value must be set');
    }

    CookieManager.debug('Setting cookie "%s"', cookieData.name);

    const isMaximumBytesReached =
      Buffer.byteLength(cookieData.name, 'utf8') > CookieManager.MAX_COOKIE_LENGTH ||
      Buffer.byteLength(cookieData.value, 'utf8') > CookieManager.MAX_COOKIE_LENGTH;
    if (isMaximumBytesReached) {
      throw new Error('Maximum bytes for a cookie exceeded');
    }

    await session.cookies.set(cookieData);
    CookieManager.debug('Successfully set cookie "%s"', cookieData.name);
  }

  public static async set(cookiesRaw: string[], urlRaw: string, session: Electron.Session): Promise<void> {
    const origin = new URL(urlRaw).origin;
    const cookies: SetCookieParser.Cookie[] = SetCookieParser.parse(cookiesRaw);

    await Promise.all(
      cookies.map(async cookie => {
        const expirationDate = CookieManager.translateExpirationDate(cookie.expires);
        await CookieManager._set(
          {
            domain: cookie.domain,
            expirationDate,
            httpOnly: cookie.httpOnly ? cookie.httpOnly : false,
            name: cookie.name,
            path: cookie.path ? cookie.path : '/',
            secure: cookie.secure ? cookie.secure : false,
            url: origin,
            value: cookie.value,
          },
          session
        );
      })
    );
  }

  public static async get(url: string, session: Electron.Session): Promise<string | undefined> {
    let serializedCookie = '';

    // Get all cookies related to this url
    const cookiesRaw: Electron.Cookie[] = ((await session.cookies.get({url})) as unknown) as Electron.Cookie[];
    if (cookiesRaw !== undefined && cookiesRaw.length > 0) {
      for (const cookie of cookiesRaw) {
        const {name, value} = cookie;
        serializedCookie += `${name}=${value}${CookieManager.COOKIE_SEPARATOR}`;
      }
    }

    return serializedCookie === '' ? undefined : serializedCookie;
  }
}
