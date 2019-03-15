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

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {initReactI18next} from 'react-i18next';

export const fallbackLanguage = 'en';

export const resourcesName = {
  English: 'en',
  Français: 'fr',
};

const resources = require('../../../locales/translation.json');

// tslint:disable-next-line:no-floating-promises
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    defaultNS: 'translations',
    fallbackLng: fallbackLanguage,
    interpolation: {escapeValue: false},
    // Set on false as we use content as keys
    keySeparator: false,
    ns: ['translations'],
    // Set on false as we use content as namespaces
    nsSeparator: false,
    resources: resources,
  });

export default i18n;
