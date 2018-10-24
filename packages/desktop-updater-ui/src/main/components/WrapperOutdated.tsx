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
import {DecisionButton, GlobalStyle, MainHeading, UpdaterContainer} from './UpdaterStyles';

import {Content, Paragraph} from '@wireapp/react-ui-kit';

enum OS_FAMILY {
  DARWIN = 'darwin',
}

interface State {}

interface Props {
  environment?: OS_FAMILY;
}

class WrapperOutdated extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      environment: undefined,
      ...props,
    };
  }

  public static TOPIC = {
    ON_BUTTON_CLICK: 'WrapperOutdated.TOPIC.ON_BUTTON_CLICK',
  };

  componentDidMount(): void {
    window.addEventListener('onDataReceived', this._onDataReceived, false);
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState(nextProps);
  }

  componentWillUnmount(): void {
    window.removeEventListener('onDataReceived', this._onDataReceived);
  }

  _onDataReceived = (event: Event): void => {
    const environment = (event as CustomEvent).detail;
    this.setState({environment});
  };

  private readonly onCloseClick = (): void => {
    window.dispatchEvent(new CustomEvent(WrapperOutdated.TOPIC.ON_BUTTON_CLICK, {detail: {showDetails: true}}));
  };

  private renderButtonText(os?: OS_FAMILY): string {
    switch (os) {
      case OS_FAMILY.DARWIN:
        return 'Open the Mac App Store';
      default:
        return 'Go on Wire.com';
    }
  }
  render() {
    return (
      <UpdaterContainer>
        <Content style={{padding: '24px 34px'}}>
          <MainHeading>Wire must be updated</MainHeading>
          <Paragraph>This version of Wire is no longer supported. To continue to use it, please update it.</Paragraph>
          {typeof this.state.environment !== 'string' ? (
            ''
          ) : (
            <DecisionButton onClick={this._onCloseClick}>
              {this.renderButtonText(this.props.environment.toLowerCase())}
            </DecisionButton>
          )}
        </Content>
        <GlobalStyle />
      </UpdaterContainer>
    );
  }
}

export {WrapperOutdated, OS_FAMILY};
