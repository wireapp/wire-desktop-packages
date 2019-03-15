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

import i18n, {resourcesName} from '../../src/main/libs/Localization';
import {makeDecorator} from '@storybook/addons';
import {select} from '@storybook/addon-knobs';

export const withLocalization = makeDecorator({
  name: 'withLocalization',
  wrapper: (getStory, context, {parameters}) => {
    const language = select('Language', resourcesName, 'en');
    i18n.changeLanguage(language);
    return getStory(context);
  },
});
