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
import {WrapperOutdated} from './WrapperOutdatedView';

export interface WrapperOutdatedState {
  environment?: NodeJS.Platform;
}

interface Props {}

class WrapperOutdatedContainer extends React.Component<Props, WrapperOutdatedState> {
  public static TOPIC = {
    ON_DATA_RECEIVED: 'WrapperOutdatedContainer.TOPIC.ON_DATA_RECEIVED',
  };

  componentDidMount(): void {
    window.addEventListener(WrapperOutdatedContainer.TOPIC.ON_DATA_RECEIVED, this.onDataReceived, false);
  }

  componentWillUnmount(): void {
    window.removeEventListener(WrapperOutdatedContainer.TOPIC.ON_DATA_RECEIVED, this.onDataReceived);
  }

  onDataReceived = (event: Event): void => {
    const environment = (event as CustomEvent).detail;
    this.setState({environment});
  };

  render() {
    return <WrapperOutdated {...this.state} />;
  }
}

export {WrapperOutdatedContainer};
