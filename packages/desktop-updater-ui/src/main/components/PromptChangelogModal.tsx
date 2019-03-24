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
import {COLOR, H1, H2, H3, H4, Link, Paragraph, Small, Text} from '@wireapp/react-ui-kit';
import * as Long from 'long';
import {DateTime} from 'luxon';
import * as React from 'react';
import {Trans, WithTranslation, withTranslation} from 'react-i18next';
import * as Markdown from 'react-markdown';
import styled from 'styled-components';
import i18n from '../libs/Localization';
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

class PromptChangelogModal extends React.Component<Props & WithTranslation, State> {
  public static readonly PROMPT_WINDOW_SIZE = {height: 250, width: 480};
  public static readonly CHANGELOG_WINDOW_SIZE = {height: Math.round(259 * 1.4), width: Math.round(480 * 1.3)};

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
    const targetEnvironment =
      typeof manifest.targetEnvironment === 'string' ? manifest.targetEnvironment.toLowerCase() : '';
    return (
      <Modal fullscreen onClose={this.hideChangelog} style={{backgroundColor: 'white'}}>
        <MainHeading>
          <Trans>What's new</Trans>
        </MainHeading>
        {manifest.targetEnvironment !== 'PRODUCTION' && (
          <Paragraph style={{marginBottom: 10}}>
            <Text fontSize="12px" bold style={{backgroundColor: COLOR.RED, padding: 5}} color={COLOR.WHITE}>
              <Trans>WARNING</Trans>
            </Text>
            <BoldText color={COLOR.RED}>
              {' '}
              <Trans>This release is intended for {{targetEnvironment}} environment only.</Trans>
            </BoldText>
          </Paragraph>
        )}
        <Paragraph>
          {typeof manifest.changelog === 'string' && manifest.changelog !== '' ? (
            <Markdown escapeHtml={true} skipHtml={true} source={manifest.changelog} renderers={{heading, paragraph}} />
          ) : (
            <Small>
              <Trans>No changelog is available for this update</Trans>
            </Small>
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
              <Trans>See changelog for older versions</Trans>
            </Link>
          </Paragraph>
        )}
        <SelectableParagraph>
          <NormalText block>
            <BoldText>
              <Trans>Version:</Trans>
            </BoldText>{' '}
            {manifest.webappVersionNumber}
          </NormalText>
          <NormalText block>
            <BoldText>
              <Trans>Released on:</Trans>
            </BoldText>{' '}
            {DateTime.fromISO(manifest.releaseDate, {locale: i18n.language}).toLocaleString(
              DateTime.DATETIME_HUGE_WITH_SECONDS
            )}
          </NormalText>
          <NormalText block>
            <BoldText>
              <Trans>Size of the update:</Trans>
            </BoldText>{' '}
            {`${(
              new Long(
                manifest.fileContentLength.low,
                manifest.fileContentLength.high,
                manifest.fileContentLength.unsigned
              ).toNumber() / 1000000
            ).toFixed(2)} MB`}
          </NormalText>
          <NormalText block>
            <BoldText>
              <Trans>Checksum of the update:</Trans>
            </BoldText>{' '}
            {manifest.fileChecksum}
          </NormalText>
          <BoldText>
            <Trans>This update is digitally signed.</Trans>
          </BoldText>
        </SelectableParagraph>
      </Modal>
    );
  }
}

const TranslatedPromptChangelogModal = withTranslation()(PromptChangelogModal);

export {PromptChangelogModal, TranslatedPromptChangelogModal};
