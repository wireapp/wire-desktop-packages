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

import * as React from 'react';
import {render} from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Prompt from './components/Prompt';

const rootEl = document.getElementById('root');

render(
  <AppContainer>
    <Prompt />
  </AppContainer>,
  rootEl
);

// Hot Module Replacement API
declare let module: {hot: any};

if (module.hot) {
  module.hot.accept('./components/Prompt', () => {
    const NewPrompt = require('./components/Prompt').default;

    render(
      <AppContainer>
        <NewPrompt />
      </AppContainer>,
      rootEl
    );
  });
}
