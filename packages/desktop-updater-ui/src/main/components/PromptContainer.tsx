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

import * as Updater from '@wireapp/desktop-updater-spec';
import * as React from 'react';
import {Prompt} from './Prompt';

export interface PromptContainerState {
  metadata?: Updater.Metadata;
  changelogUrl: string;
  isWebappBlacklisted: boolean;
  isWebappTamperedWith: boolean;
}

interface Props {}

class PromptContainer extends React.Component<Props, PromptContainerState> {
  public static TOPIC = {
    ON_DATA_RECEIVED: 'PromptContainer.TOPIC.ON_DATA_RECEIVED',
  };

  componentDidMount() {
    window.addEventListener(PromptContainer.TOPIC.ON_DATA_RECEIVED, this.onDataReceived, false);
  }

  componentWillUnmount(): void {
    window.removeEventListener(PromptContainer.TOPIC.ON_DATA_RECEIVED, this.onDataReceived);
  }

  onDataReceived = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const metadata: Updater.Metadata = customEvent.detail.metadata;
    const changelogUrl: string = customEvent.detail.changelogUrl;
    const isWebappBlacklisted: boolean = customEvent.detail.isWebappBlacklisted;
    const isWebappTamperedWith: boolean = customEvent.detail.isWebappTamperedWith;

    this.setState({metadata, changelogUrl, isWebappBlacklisted, isWebappTamperedWith});
  };

  render() {
    return <Prompt {...this.state} />;
  }
}

export {PromptContainer};
