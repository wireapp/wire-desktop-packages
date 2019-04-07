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

import {Global, css} from '@emotion/core';
import styled from '@emotion/styled';
import {Button, Column, Columns, Content, H2, Paragraph, Small, StyledApp} from '@wireapp/react-ui-kit';
import React from 'react';

const UpdaterContainer = styled(StyledApp)`
  background-color: transparent;
`;

const GlobalStyle = () => (
  <Global
    styles={css`
      html,
      body {
        user-select: none;
        cursor: default;
        background-color: transparent;
        overflow: hidden;
        -webkit-app-region: drag;
      }

      *::selection {
        background: transparent;
        color: #171717;
      }
      *::-webkit-selection {
        background: transparent;
        color: #171717;
      }

      button,
      input,
      label {
        -webkit-app-region: no-drag;
      }
    `}
  />
);

const SelectableParagraph = styled(Paragraph)`
  user-select: text;
  cursor: text;
  word-break: break-all;
  margin-bottom: 0;
`;

const MainHeadingTitle: any = styled(H2)`
  margin-top: 10px;
  @media (max-width: 480px) {
    margin-top: 10px;
  }
`;

const MainContent = styled(Content)`
  padding: 24px 34px;
`;

const ProgressContainer = styled(Columns)`
  -webkit-flex-direction: row;
  flex-direction: row;

  @media (max-width: 480px) {
    -webkit-flex-direction: row;
    flex-direction: row;
  }
`;
const ProgressBlock = Column;
const ProgressBlockLoader = styled(ProgressBlock)`
  max-width: 43px;
`;
const ProgressBlockStats = ProgressBlock;

const RegularButton = styled(Button)`
  margin-bottom: 0;
  font-size: 14px;
`;

const DecisionButton = styled(RegularButton)`
  width: 47.5%;

  &:first-of-type {
    margin-right: 2.5%;
  }

  &:last-of-type {
    margin-left: 2.5%;
  }
`;

const SmallBlock = styled(Small)`
  display: block;
`;

export {
  DecisionButton,
  GlobalStyle,
  MainContent,
  MainHeadingTitle,
  ProgressBlockLoader,
  ProgressBlockStats,
  ProgressContainer,
  RegularButton,
  SelectableParagraph,
  SmallBlock,
  UpdaterContainer,
};
