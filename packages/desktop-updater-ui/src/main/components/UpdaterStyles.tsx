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

import {Button, Column, Columns, Content, H2, Paragraph, Small, StyledApp} from '@wireapp/react-ui-kit';
import styled, {StyledComponentClass, createGlobalStyle} from 'styled-components';

const UpdaterContainer = styled(StyledApp)`
  background-color: transparent;
`;

const GlobalStyle = createGlobalStyle`
  html, body {
    user-select: none;
    cursor: default;
    background-color: transparent;
    overflow: hidden;
    -webkit-app-region: no-drag;
  }

  *::selection {
    background: #171717;
    color: #fff;
  }
  *::-webkit-selection {
    background: #171717;
    color: #fff;
  }

  button, input, label, form {
    -webkit-app-region: drag;
  }
`;

const SelectableParagraph = styled(Paragraph)`
  user-select: text;
  cursor: text;
  word-break: break-all;
  margin-bottom: 0;
`;

const MainHeading: StyledComponentClass<React.ClassAttributes<HTMLHeadingElement>, any, any> = styled(H2)`
  margin-top: 0;
`;

const MainContent = styled(Content)`
  padding: 24px 34px;
`;

const ProgressContainer = Columns;
const ProgressBlock = Column;
const ProgressBlockLoader = styled(ProgressBlock)`
  max-width: 43px;
`;
const ProgressBlockStats = ProgressBlock;

const RegularButton: StyledComponentClass<React.ButtonHTMLAttributes<HTMLButtonElement>, any, any> = styled(Button)`
  margin-bottom: 0;
  font-size: 14px;
`;

const DecisionButton: StyledComponentClass<React.ButtonHTMLAttributes<HTMLButtonElement>, any, any> = styled(
  RegularButton
)`
  width: 47.5%;

  &:first-child {
    margin-right: 2.5%;
  }

  &:last-child {
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
  MainHeading,
  ProgressBlockLoader,
  ProgressBlockStats,
  ProgressContainer,
  RegularButton,
  SelectableParagraph,
  SmallBlock,
  UpdaterContainer,
};
