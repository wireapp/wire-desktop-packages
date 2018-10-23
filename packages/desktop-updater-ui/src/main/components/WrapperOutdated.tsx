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

import {EventDispatcher} from '../libs/EventDispatcher';

import * as React from 'react';
import {GlobalStyle, MainHeading, UpdaterContainer} from './UpdaterStyles';

import {ButtonLink, Content, Paragraph} from '@wireapp/react-ui-kit';

interface State {
  environment: string | undefined;
}

interface Props {}

class WrapperOutdated extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      environment: undefined,
      ...props,
    };
  }

  componentDidMount(): void {
    window.addEventListener('onDataReceived', this._onDataReceived, false);
  }

  _onDataReceived = (event: Event): void => {
    const environment = (event as CustomEvent).detail;
    this.setState({environment});
  };

  _onCloseClick = (): void => {
    EventDispatcher.send('onButtonClicked', {showDetails: true});
  };

  componentWillUnmount = (): void => {
    window.removeEventListener('onDataReceived', this._onDataReceived);
  };

  render() {
    return (
      <UpdaterContainer>
        <Content style={{padding: '24px 34px'}}>
          <MainHeading>Wire must be updated</MainHeading>
          <Paragraph>This version of Wire is no longer supported. To continue to use it, please update it.</Paragraph>
          {typeof this.state.environment !== 'string' ? (
            ''
          ) : (
            <ButtonLink style={{marginBottom: '0px'}} onClick={this._onCloseClick}>
              {this.state.environment.toLowerCase() === 'darwin' ? 'Open the Mac App Store' : 'Go on Wire.com'}
            </ButtonLink>
          )}
        </Content>
        <GlobalStyle />
      </UpdaterContainer>
    );
  }
}

export {WrapperOutdated};
