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

import styled from '@emotion/styled';
import * as Updater from '@wireapp/desktop-updater-spec';
import {COLOR, H1, H2, H3, H4, Link, Paragraph, Small, Text} from '@wireapp/react-ui-kit';
import Long from 'long';
import {DateTime} from 'luxon';
import React from 'react';
import {Trans, WithTranslation, withTranslation} from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import i18n from '../libs/Localization';
import {Modal} from './ModalBack';
import {MainHeadingTitle as UpdaterStylesMainHeadingTitle} from './UpdaterStyles';

const MainHeadingTitle = styled(UpdaterStylesMainHeadingTitle)`
  margin-top: 0;
`;

const BoldText = styled(Text)`
  font-size: 14px;
  font-weight: 600;
`;

const SmallBoldText = styled(BoldText)`
  font-size: 11px;
`;

const NormalText = styled(Text)`
  font-size: 14px;
`;

const SmallNormalText = styled(NormalText)`
  font-size: 11px;
`;

const Selectable = styled.span`
  user-select: text;
  cursor: text;
  word-break: break-all;
  margin-bottom: 0;

  ::selection {
    background: #171717;
    color: #fff;
  }
  ::-webkit-selection {
    background: #171717;
    color: #fff;
  }
`;

interface Props {
  changelogUrl: string;
  envelope: {publicKey: string};
  manifest: Updater.Manifest;
  onClose: () => void;
}

interface State {
  decision: Updater.Decision;
  isUpdatesInstallAutomatically: boolean;
  showSigningDetails: boolean;
}

class PromptChangelogModal extends React.Component<Props & WithTranslation, State> {
  public static readonly PROMPT_WINDOW_SIZE = {height: 250, width: 480};
  public static readonly CHANGELOG_WINDOW_SIZE = {height: Math.round(259 * 1.4), width: Math.round(480 * 1.3)};
  private signingDetails: HTMLParagraphElement | null = null;

  constructor(props) {
    super(props);
    this.state = {...props, showSigningDetails: false};
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.showSigningDetails !== this.state.showSigningDetails &&
      this.state.showSigningDetails &&
      this.signingDetails
    ) {
      this.signingDetails.scrollIntoView({behavior: 'smooth'});
    }
  }

  toggleSigningDetails = () => {
    this.setState(prevState => {
      return {...prevState, showSigningDetails: !prevState.showSigningDetails};
    });
  };

  hideChangelog = (): void => {
    this.props.onClose();
  };

  render() {
    const {changelogUrl, envelope, manifest} = this.props;
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
      manifest && typeof manifest.targetEnvironment === 'string' ? manifest.targetEnvironment.toLowerCase() : '';
    const updateSize = new Long(
      manifest.fileContentLength.low,
      manifest.fileContentLength.high,
      manifest.fileContentLength.unsigned
    );
    return (
      <Modal fullscreen onClose={this.hideChangelog}>
        <MainHeadingTitle>
          <Trans>What's new</Trans>
        </MainHeadingTitle>
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
            <ReactMarkdown
              escapeHtml={true}
              skipHtml={true}
              source={manifest.changelog}
              renderers={{heading, paragraph}}
            />
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
              textTransform="none"
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
        <Paragraph style={{marginBottom: 0}}>
          <NormalText block>
            <BoldText>
              <Trans>Released on:</Trans>{' '}
            </BoldText>
            <Selectable>
              {DateTime.fromISO(manifest.releaseDate, {locale: i18n.language}).toLocaleString(DateTime.DATETIME_FULL)}
            </Selectable>
          </NormalText>
          <NormalText block>
            <BoldText>
              <Trans>Size of the update:</Trans>{' '}
            </BoldText>
            <Selectable>
              {`${(updateSize.toNumber() / 1000000).toFixed(2)} `}
              <Trans>MB</Trans>
            </Selectable>
          </NormalText>
          <NormalText block>
            <BoldText>
              <Trans>Version:</Trans>{' '}
            </BoldText>
            <Selectable>{manifest.webappVersionNumber}</Selectable>
          </NormalText>
        </Paragraph>
        <Link fontSize="14px" textTransform="none" bold href="javascript://" onClick={this.toggleSigningDetails}>
          <Trans>This update is digitally signed.</Trans>
        </Link>
        {this.state.showSigningDetails ? (
          <Paragraph
            ref={el => {
              this.signingDetails = el;
            }}
          >
            <SmallNormalText block>
              <SmallBoldText>
                <Trans>Checksum of the update:</Trans>{' '}
              </SmallBoldText>
              <Selectable>{manifest.fileChecksum}</Selectable>
            </SmallNormalText>
            <SmallNormalText block>
              <SmallBoldText>
                <Trans>Fingerprint of the signing key:</Trans>{' '}
              </SmallBoldText>
              <Selectable>{envelope.publicKey}</Selectable>
            </SmallNormalText>
          </Paragraph>
        ) : null}
      </Modal>
    );
  }
}

const TranslatedPromptChangelogModal = withTranslation()(PromptChangelogModal);

export {PromptChangelogModal, TranslatedPromptChangelogModal};
