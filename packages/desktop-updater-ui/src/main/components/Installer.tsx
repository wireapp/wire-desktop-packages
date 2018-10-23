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
import '../../../src/main/assets/scss/Installer.scss';
import '../../../src/main/assets/scss/Main.scss';

import {Columns, Content, H2, Loading, Paragraph, Small, StyledApp} from '@wireapp/react-ui-kit';

interface ProgressInterface {
  elapsed: number;
  percent: number | null;
  remaining: number | undefined;
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
        percent: null,
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
        percent: null,
      },
    });
  };

  componentWillUnmount(): void {
    window.removeEventListener(Installer.TOPIC.ON_PROGRESS, this.updateProgress);
  }

  render() {
    return (
      <StyledApp className="node">
        <Content style={{padding: '24px 34px'}}>
          <H2>{this.state.installing ? 'Installing' : 'Downloading'} the update</H2>
          <Columns className="progress">
            <div>
              <Loading progress={this.state.progress.percent} />
            </div>
            <div>
              <Paragraph id="progress">
                {this.state.installing
                  ? `Installing...`
                  : `${
                      this.state.progress.startedAt === 0
                        ? `Download is starting...`
                        : typeof this.state.progress.remaining === 'undefined'
                          ? `Download has started...`
                          : `${Math.round(this.state.progress.remaining)} seconds remaining`
                    }`}
                <Small className="stats">
                  {(this.state.progress.transferred / 1000000).toFixed(1)} of{' '}
                  {(this.state.progress.total / 1000000).toFixed(1)} MB at{' '}
                  {(this.state.progress.speed / 1000000).toFixed(1)} Mb/s
                </Small>
              </Paragraph>
            </div>
          </Columns>
        </Content>
      </StyledApp>
    );
  }
}

export {Installer};
