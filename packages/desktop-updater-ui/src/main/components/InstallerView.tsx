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
import React from 'react';
import {Trans, WithTranslation, withTranslation} from 'react-i18next';

import {InstallerContainerState} from './Installer';
import {
  GlobalStyle,
  MainContent,
  MainHeadingTitle,
  ProgressBlockLoader,
  ProgressBlockStats,
  ProgressContainer,
  SmallBlock,
  UpdaterContainer,
} from './UpdaterStyles';

interface Props extends InstallerContainerState {}

class Installer extends React.Component<Props & WithTranslation> {
  render(): JSX.Element {
    const {installing, progress} = this.props;
    const remaining = progress.remaining ? Math.round(progress.remaining) : undefined;
    const transferred = (progress.transferred / 1000000).toFixed(1);
    const total = (progress.total / 1000000).toFixed(1);
    const speed = (progress.speed / 1000000).toFixed(1);
    return (
      <UpdaterContainer>
        <MainContent>
          <MainHeadingTitle>
            {installing ? <Trans>Installing the update</Trans> : <Trans>Downloading the update</Trans>}
          </MainHeadingTitle>
          <ProgressContainer>
            <ProgressBlockLoader>
              <Loading progress={progress.percent} />
            </ProgressBlockLoader>
            <ProgressBlockStats>
              <Paragraph>
                {installing ? (
                  <Trans>Installing...</Trans>
                ) : progress.startedAt === 0 ? (
                  <Trans>Download is starting...</Trans>
                ) : progress.remaining ? (
                  <Trans count={remaining}>{{remaining}} second remaining</Trans>
                ) : (
                  <Trans>Download has started...</Trans>
                )}
                <SmallBlock>
                  <Trans>
                    {installing ? total : transferred} of {{total}} MB at {{speed}} Mb/s
                  </Trans>
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

const TranslatedInstaller = withTranslation()(Installer);

export {TranslatedInstaller};
