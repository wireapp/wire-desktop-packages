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

import React from 'react';
import {render} from 'react-dom';
import {InstallerContainer, PromptContainer, WrapperOutdatedContainer} from './index';
import {i18n} from './libs/Localization';

const components = {
  Prompt: data => {
    return <PromptContainer {...data} />;
  },

  Installer: () => {
    return <InstallerContainer />;
  },

  WrapperOutdated: data => {
    return <WrapperOutdatedContainer {...data} />;
  },
};

const SIGNAL_EVENT_NAME = 'onDataReceived';
window.addEventListener(
  SIGNAL_EVENT_NAME,
  async event => {
    const {component, props, locale} = (event as CustomEvent).detail;
    if (typeof components[component] === 'function') {
      // Change the language by Electron's locale
      try {
        await i18n.changeLanguage(locale);
      } catch (error) {}

      // Render the component
      render(components[component](props), document.getElementById('root'));
    }
  },
  {once: true},
);
