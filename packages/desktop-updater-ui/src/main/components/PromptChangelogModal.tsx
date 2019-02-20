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

import * as Updater from '@wireapp/desktop-updater-spec';
import {COLOR, H1, H2, H3, H4, Link, Paragraph, Small, Text} from '@wireapp/react-ui-kit';
import * as Long from 'long';
import {DateTime} from 'luxon';
import * as React from 'react';
import * as Markdown from 'react-markdown';
import styled from 'styled-components';
//import {EventDispatcher} from '../libs/EventDispatcher';
import {Modal} from './ModalBack';
import {MainHeading, SelectableParagraph} from './UpdaterStyles';

const BoldText = styled(Text)`
  font-size: 14px;
  font-weight: 600;
`;

const NormalText = styled(Text)`
  font-size: 14px;
`;

interface Props {
  manifest: any;
  changelogUrl: string;
  onClose: () => void;
}

interface State {
  decision: Updater.Decision;
  isUpdatesInstallAutomatically: boolean;
}

class PromptChangelogModal extends React.Component<Props, State> {
  public static readonly PROMPT_WINDOW_SIZE = {height: 287, width: 480};
  public static readonly CHANGELOG_WINDOW_SIZE = {height: Math.round(289 * 1.4), width: Math.round(480 * 1.3)};

  hideChangelog = (): void => {
    this.props.onClose();
  };

  render() {
    const {manifest, changelogUrl} = this.props;
    const heading: React.SFC<{level: number}> = props => {
      switch (props.level) {
        case 1:
          return <H1>{props.children}</H1>;
        case 2:
          return <H2>{props.children}</H2>;
        case 3:
          return <H3>{props.children}</H3>;
        default:
          return <H4>{props.children}</H4>;
      }
    };
    const paragraph: React.SFC = props => {
      return <Paragraph>{props.children}</Paragraph>;
    };
    return (
      <Modal fullscreen onClose={this.hideChangelog} style={{backgroundColor: 'white'}}>
        <MainHeading>{"What's new"}</MainHeading>
        {manifest.targetEnvironment !== 'PRODUCTION' && (
          <Paragraph style={{marginBottom: 10}}>
            <Text fontSize="12px" bold style={{backgroundColor: COLOR.RED, padding: 5}} color={COLOR.WHITE}>
              {'WARNING'}
            </Text>
            <BoldText color={COLOR.RED}>
              {` This release is intended for ${manifest.targetEnvironment.toLowerCase()} environment only.`}
            </BoldText>
          </Paragraph>
        )}
        <Paragraph>
          {typeof manifest.changelog === 'string' ? (
            <Markdown escapeHtml={true} skipHtml={true} source={manifest.changelog} renderers={{heading, paragraph}} />
          ) : (
            <Small>{'No changelog is available for this update'}</Small>
          )}
        </Paragraph>
        {changelogUrl && (
          <Paragraph>
            <Link
              fontSize="14px"
              textTransform="normal"
              style={{fontWeight: 'normal'}}
              href={changelogUrl}
              target="_blank"
              rel="noopener noreferrer"
              color={COLOR.BLUE}
            >
              {'See changelog for older versions'}
            </Link>
          </Paragraph>
        )}
        <SelectableParagraph>
          <NormalText block>
            <BoldText>{'Version: '}</BoldText>
            {manifest.webappVersionNumber}
          </NormalText>
          <NormalText block>
            <BoldText>{'Released on: '}</BoldText>
            {DateTime.fromISO(manifest.releaseDate, {zone: 'utc'})
              .setLocale('en-US')
              .toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS)}
          </NormalText>
          <NormalText block>
            <BoldText>{'Size of the update: '}</BoldText>
            {`${(
              new Long(
                manifest.fileContentLength.low,
                manifest.fileContentLength.high,
                manifest.fileContentLength.unsigned
              ).toNumber() / 1000000
            ).toFixed(2)} MB`}
          </NormalText>
          <NormalText block>
            <BoldText>{'Checksum of the update: '}</BoldText>
            {manifest.fileChecksum.toString('hex')}
          </NormalText>
          <BoldText>{'This update is digitally signed.'}</BoldText>
        </SelectableParagraph>
      </Modal>
    );
  }
}

export {PromptChangelogModal};
