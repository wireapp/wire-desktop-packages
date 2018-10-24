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

import {Paragraph} from '@wireapp/react-ui-kit';
import * as React from 'react';
import {GlobalStyle, MainContent, MainHeading, RegularButton, UpdaterContainer} from './UpdaterStyles';

interface State {
  environment?: NodeJS.Platform;
}

interface Props {
  environment?: NodeJS.Platform;
}

class WrapperOutdated extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      environment: undefined,
      ...props,
    };
  }

  public static OS_FAMILY: {[s: string]: NodeJS.Platform} = {
    DARWIN: 'darwin',
  };

  public static TOPIC = {
    ON_BUTTON_CLICK: 'WrapperOutdated.TOPIC.ON_BUTTON_CLICK',
    ON_DATA_RECEIVED: 'WrapperOutdated.TOPIC.ON_DATA_RECEIVED',
  };

  componentDidMount(): void {
    window.addEventListener(WrapperOutdated.TOPIC.ON_DATA_RECEIVED, this.onDataReceived, false);
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState(nextProps);
  }

  componentWillUnmount(): void {
    window.removeEventListener(WrapperOutdated.TOPIC.ON_DATA_RECEIVED, this.onDataReceived);
  }

  onDataReceived = (event: Event): void => {
    const environment = (event as CustomEvent).detail;
    this.setState({environment});
  };

  private readonly onCloseClick = (): void => {
    window.dispatchEvent(new CustomEvent(WrapperOutdated.TOPIC.ON_BUTTON_CLICK, {detail: {showDetails: true}}));
  };

  private renderButtonText(os?: NodeJS.Platform): string {
    switch (os) {
      case WrapperOutdated.OS_FAMILY.DARWIN:
        return 'Open the Mac App Store';
      default:
        return 'Go on Wire.com';
    }
  }
  render() {
    return (
      <UpdaterContainer>
        <MainContent>
          <MainHeading>Wire must be updated</MainHeading>
          <Paragraph>This version of Wire is no longer supported. To continue to use it, please update it.</Paragraph>
          {typeof this.state.environment !== 'string' ? (
            ''
          ) : (
            <RegularButton onClick={this.onCloseClick}>{this.renderButtonText(this.state.environment)}</RegularButton>
          )}
        </MainContent>
        <GlobalStyle />
      </UpdaterContainer>
    );
  }
}

export {WrapperOutdated};
