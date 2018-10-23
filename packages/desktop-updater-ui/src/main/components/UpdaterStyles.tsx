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

import {H2, Paragraph, StyledApp} from '@wireapp/react-ui-kit';
import styled, {createGlobalStyle} from 'styled-components';

const UpdaterContainer = styled(StyledApp)`
  background-color: transparent;
`;

const GlobalStyle = createGlobalStyle`
  html, body {
    user-select: none;
    cursor: default;
    background-color: red;
    overflow: hidden;
    -webkit-app-region: drag;
  }

  html::selection, body::selection {
    background: #171717;
    color: #fff;
  }
`;

const SelectableParagraph = styled(Paragraph)`
  user-select: text;
  cursor: text;
`;

const MainHeading = styled(H2)`
  margin-top: 0;
`;

export {UpdaterContainer, GlobalStyle, SelectableParagraph, MainHeading};
