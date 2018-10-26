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

import {Loading, Paragraph} from '@wireapp/react-ui-kit';
import * as React from 'react';
import {InstallerContainerState} from './InstallerContainer';
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

interface Props extends InstallerContainerState {}

interface State {}

class Installer extends React.Component<Props, State> {
  render() {
    return (
      <UpdaterContainer>
        <MainContent>
          <MainHeading>{`${this.props.installing ? 'Installing' : 'Downloading'} the update`}</MainHeading>
          <ProgressContainer>
            <ProgressBlockLoader>
              <Loading progress={this.props.progress.percent} />
            </ProgressBlockLoader>
            <ProgressBlockStats>
              <Paragraph>
                {this.props.installing
                  ? `Installing...`
                  : `${
                      this.props.progress.startedAt === 0
                        ? `Download is starting...`
                        : typeof this.props.progress.remaining === 'undefined'
                          ? `Download has started...`
                          : `${Math.round(this.props.progress.remaining)} seconds remaining`
                    }`}
                <SmallBlock>
                  {`${(this.props.progress.transferred / 1000000).toFixed(1)} of `}
                  {`${(this.props.progress.total / 1000000).toFixed(1)} MB at `}
                  {`${(this.props.progress.speed / 1000000).toFixed(1)}  Mb/s`}
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
