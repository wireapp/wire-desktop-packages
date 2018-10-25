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

import {Loading, Paragraph} from '@wireapp/react-ui-kit';
import {
  GlobalStyle,
  MainContent,
  MainHeading,
  ProgressBlockLoader,
  ProgressBlockStats,
  ProgressContainer,
  SmallBlock,
  UpdaterContainer,
} from './UpdaterStyles';

interface ProgressInterface {
  elapsed: number;
  percent?: number;
  remaining?: number;
  speed: number; // in bytes
  startedAt: number;
  total: number;
  transferred: number;
}

interface Props {}

interface State {
  progress: ProgressInterface;
  installing: boolean;
}

class Installer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      installing: false,
      progress: {
        elapsed: 0,
        percent: undefined,
        remaining: undefined,
        speed: 0,
        startedAt: 0,
        total: 0,
        transferred: 0,
      },
      ...props,
    };
  }

  public static TOPIC = {
    ON_PROGRESS: 'Installer.TOPIC.ON_PROGRESS',
  };

  componentWillReceiveProps(nextProps: Props) {
    this.setState(nextProps);
  }

  componentDidMount(): void {
    window.addEventListener(Installer.TOPIC.ON_PROGRESS, this.updateProgress, false);
  }

  updateProgress = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const detail: ProgressInterface = customEvent.detail;

    if (detail.percent === 1) {
      return this.finishedProgress();
    }
    this.setState({progress: detail});
  };

  finishedProgress = (): void => {
    this.setState({
      installing: true,
      progress: {
        ...this.state.progress,
        percent: undefined,
      },
    });
  };

  componentWillUnmount(): void {
    window.removeEventListener(Installer.TOPIC.ON_PROGRESS, this.updateProgress);
  }

  render() {
    return (
      <UpdaterContainer>
        <MainContent>
          <MainHeading>{this.state.installing ? 'Installing' : 'Downloading'} the update</MainHeading>
          <ProgressContainer>
            <ProgressBlockLoader>
              <Loading progress={this.state.progress.percent} />
            </ProgressBlockLoader>
            <ProgressBlockStats>
              <Paragraph>
                {this.state.installing
                  ? `Installing...`
                  : `${
                      this.state.progress.startedAt === 0
                        ? `Download is starting...`
                        : typeof this.state.progress.remaining === 'undefined'
                          ? `Download has started...`
                          : `${Math.round(this.state.progress.remaining)} seconds remaining`
                    }`}
                <SmallBlock>
                  {(this.state.progress.transferred / 1000000).toFixed(1)} of{' '}
                  {(this.state.progress.total / 1000000).toFixed(1)} MB at{' '}
                  {(this.state.progress.speed / 1000000).toFixed(1)} Mb/s
                </SmallBlock>
              </Paragraph>
            </ProgressBlockStats>
          </ProgressContainer>
        </MainContent>
        <GlobalStyle />
      </UpdaterContainer>
    );
  }
}

export {Installer};
