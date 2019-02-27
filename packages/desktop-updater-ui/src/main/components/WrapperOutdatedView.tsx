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

import {Paragraph} from '@wireapp/react-ui-kit';
import * as React from 'react';
import {EventDispatcher} from '../libs/EventDispatcher';
import {GlobalStyle, MainContent, MainHeading, RegularButton, UpdaterContainer} from './UpdaterStyles';
import {WrapperOutdatedState} from './WrapperOutdated';

interface State {}

interface Props extends WrapperOutdatedState {}

class WrapperOutdated extends React.Component<Props, State> {
  public static OS_FAMILY: {[key: string]: NodeJS.Platform} = {
    DARWIN: 'darwin',
  };

  public static TOPIC = {
    ON_BUTTON_CLICK: 'WrapperOutdated.TOPIC.ON_BUTTON_CLICK',
  };

  private readonly onCloseClick = (): void => {
    EventDispatcher.send(WrapperOutdated.TOPIC.ON_BUTTON_CLICK, {showDetails: true});
  };

  private renderButtonText(type?: NodeJS.Platform): string {
    const os = type ? type.toLowerCase() : undefined;
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
          <MainHeading>{'Wire must be updated'}</MainHeading>
          <Paragraph>
            {'This version of Wire is no longer supported. To continue to use it, please update it.'}
          </Paragraph>
          <RegularButton onClick={this.onCloseClick}>{this.renderButtonText(this.props.environment)}</RegularButton>
        </MainContent>
        <GlobalStyle />
      </UpdaterContainer>
    );
  }
}

export {WrapperOutdated};
