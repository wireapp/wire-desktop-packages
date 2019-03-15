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

import {app} from 'electron';
import i18next from 'i18next';
import * as Backend from 'i18next-node-fs-backend';
import * as path from 'path';

const CONFIG = {
  backend: {
    loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
  },
  debug: true,
  fallbackLng: ['en'],
  ns: ['downloader', 'error-dispatcher', 'installer', 'prompt', 'updater', 'wrapper-outdated'],
};

export type i18nLanguageIdentifier =
  | 'error-dispatcher:cancel'
  | 'error-dispatcher:contactUs'
  | 'error-dispatcher:errorUnknown'
  | 'error-dispatcher:errorWhileCheckingForUpdates'
  | 'error-dispatcher:errorWhileInstallingUpdate'
  | 'error-dispatcher:errorWhileProcessingUpdate'
  | 'error-dispatcher:reportThisIncident'
  | 'error-dispatcher:title'
  | 'error-dispatcher:tryAgain'
  | 'installer:title'
  | 'prompt:title'
  | 'updater:newUpdateAvailableBody'
  | 'updater:newUpdateAvailableDetails'
  | 'updater:newUpdateAvailableTitle'
  | 'wrapper-outdated:title';

export async function getLocales(
  key: i18nLanguageIdentifier,
  options?: string | i18next.TOptions<i18next.StringMap> | undefined
) {
  if (!i18next.isInitialized) {
    // Wait the app to be ready in order to get the locale from Electron on Windows
    await app.isReady();

    await i18next.use(Backend).init({
      ...CONFIG,
      lng: app.getLocale(),
    });
  }
  return i18next.t(key, options);
}
