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
import {initReactI18next} from 'react-i18next';

export const fallbackLanguage = 'en';
export const resourcesName = require('../../../locales/names.json');
const resources = require('../../../locales/translation.json');

// tslint:disable-next-line:no-floating-promises
i18n.use(initReactI18next).init({
  defaultNS: 'translations',
  fallbackLng: fallbackLanguage,
  interpolation: {escapeValue: false},
  keySeparator: false,
  lng: fallbackLanguage,
  ns: ['translations'],
  nsSeparator: false,
  resources,
});

export {i18n};
