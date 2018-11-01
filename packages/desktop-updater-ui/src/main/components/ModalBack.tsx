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

import {ArrowIcon, QUERY} from '@wireapp/react-ui-kit';
import * as React from 'react';
import styled from 'styled-components';
import {GlobalStyle} from './UpdaterStyles';

interface ModalBodyProps {
  fullscreen?: boolean;
}

const ModalWrapper = styled.div`
  position: fixed;
  display: flex;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 24px;
  z-index: 9997;
  overflow-y: auto;
`;

const ModalBody = styled.div<ModalBodyProps & React.HTMLAttributes<HTMLDivElement>>`
  ${props =>
    props.fullscreen
      ? `
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      border-radius: 0;
      justify-content: center;
      box-shadow: none;
      @media (${QUERY.tabletDown}) {
        width: initial;
      }
      `
      : `
      position: relative;
      border-radius: 8px;
      box-shadow: 0 16px 64px 0 rgba(0, 0, 0, 0.16);
      justify-content: space-between;
      @media (${QUERY.tabletDown}) {
        width: 100%;
      }
      `};
  align-items: center;
  display: flex;
  flex-direction: column;
  z-index: 9999;
  margin: auto;
  -webkit-transform: translate3d(0, 0, 0);

  background-color: transparent;
  padding: 34px;
  padding-top: 54px;
`;

const ModalClose = styled(ArrowIcon)`
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
`;

const ModalContent = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  max-width: 100%;
  overflow-y: auto;
`;

const ModalBackground = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  height: 100vh;
  width: 100vw;
  background: transparent;
  z-index: 9998;
`;

const noop = () => {};

interface ModalProps {
  fullscreen?: boolean;
  onBackgroundClick?: () => void;
  onClose?: () => void;
}

const Modal: React.SFC<ModalProps & React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  fullscreen,
  onClose,
  onBackgroundClick,
  ...props
}) => (
  <ModalWrapper>
    <ModalBody fullscreen={fullscreen}>
      <ModalContent>{children}</ModalContent>
      <ModalClose direction="left" onClick={onClose} data-uie-name="modal-close" />
    </ModalBody>
    {!fullscreen && (
      <ModalBackground
        onClick={onBackgroundClick === noop ? onClose : onBackgroundClick}
        data-uie-name="modal-background"
      />
    )}
    <GlobalStyle />
  </ModalWrapper>
);

Modal.defaultProps = {
  fullscreen: false,
  onBackgroundClick: noop,
  onClose: noop,
};

export {Modal};
