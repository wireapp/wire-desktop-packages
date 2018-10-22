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

import {EventDispatcher} from '../libs/EventDispatcher';

import * as React from 'react';
import * as Markdown from 'react-markdown';

import * as anime from 'animejs';
import * as Long from 'long';
import {DateTime} from 'luxon';

import './../assets/scss/Main.scss';
import './../assets/scss/Prompt.scss';

import {COLOR} from '@wireapp/react-ui-kit/dist/Identity';

import {Modal} from './ModalBack';

import {
  ButtonLink,
  Checkbox,
  Container,
  Content,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Link,
  Paragraph,
  Small,
  StyledApp,
  Text,
} from '@wireapp/react-ui-kit';

import * as Updater from '@wireapp/desktop-updater-spec';

export interface Props {}

interface State {
  metadata: Updater.Metadata | null;
  decision: Updater.Decision;
  changelogUrl: string;
  isWebappBlacklisted: boolean;
  isWebappTamperedWith: boolean;
  isUpdatesInstallAutomatically: boolean;
}

class Prompt extends React.Component<Props, State> {
  private content: HTMLElement | null = null;
  private modal: HTMLElement | null = null;

  private static readonly PROMPT_WINDOW_SIZE = {height: 287, width: 480};
  private static readonly CHANGELOG_WINDOW_SIZE = {height: Math.round(289 * 1.4), width: Math.round(480 * 1.3)};

  private static readonly defaultAnimationSettings = {
    easing: 'easeInOutSine',
  };

  constructor(props: Props) {
    super(props);

    this.onDecisionTaken = this.onDecisionTaken.bind(this);
    this.onUpdateClick = this.onUpdateClick.bind(this);
    this.onLaterClick = this.onLaterClick.bind(this);

    this.showChangelog = this.showChangelog.bind(this);
    this.hideChangelog = this.hideChangelog.bind(this);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
  }

  static state = {
    changelogUrl: '',
    decision: {
      allow: false,
      installAutomatically: false,
    },
    isUpdatesInstallAutomatically: false,
    isWebappBlacklisted: false,
    isWebappTamperedWith: false,
    metadata: null,
  };

  componentDidMount() {
    // Get metadata
    window.addEventListener('onDataReceived', this.onDataReceived, false);

    // Show popup
    anime({
      ...Prompt.defaultAnimationSettings,
      delay: 1000,
      duration: 250,
      opacity: [0, 1],
      targets: this.content,
    });
  }

  onDataReceived = (event: Event) => {
    const customEvent = event as CustomEvent;
    const metadata: Updater.Metadata = customEvent.detail.metadata;
    const changelogUrl: string = customEvent.detail.changelogUrl;
    const isWebappBlacklisted: boolean = customEvent.detail.isWebappBlacklisted;
    const isWebappTamperedWith: boolean = customEvent.detail.isWebappTamperedWith;

    this.setState({metadata, changelogUrl, isWebappBlacklisted, isWebappTamperedWith});
  };

  onDecisionTaken(userDecision: Partial<any>): void {
    const decision = {...this.state.decision, ...userDecision};

    console.log('Sending back decision:');
    console.log(decision);

    EventDispatcher.send('decision', decision);
  }

  componentWillUnmount(): void {
    window.removeEventListener('onDataReceived', this.onDataReceived);
  }

  onUpdateClick(event: React.MouseEvent<HTMLElement>): void {
    this.onDecisionTaken({
      allow: true,
      skipThisUpdate: false,
    });
  }

  hideChangelog(): void {
    const timeline = anime.timeline({
      autoplay: false,
      direction: 'normal',
    });

    timeline
      .add({
        ...Prompt.defaultAnimationSettings,
        complete: () => {
          if (this.modal) {
            this.modal.style.display = 'none';
          }
          EventDispatcher.send('resizeBrowserWindow', Prompt.PROMPT_WINDOW_SIZE);
        },
        duration: 250,
        opacity: [1, 0],
        targets: this.modal,
      })
      .add({
        ...Prompt.defaultAnimationSettings,
        begin: () => {
          if (this.content) {
            this.content.style.display = 'block';
          }
        },
        delay: 500,
        duration: 250,
        opacity: [0, 1],
        targets: this.content,
      })
      .play();
  }

  showChangelog(): void {
    const timeline = anime.timeline({
      autoplay: false,
      direction: 'normal',
    });

    timeline
      .add({
        ...Prompt.defaultAnimationSettings,
        complete: () => {
          EventDispatcher.send('resizeBrowserWindow', Prompt.CHANGELOG_WINDOW_SIZE);
          if (this.content) {
            this.content.style.display = 'none';
          }
        },
        duration: 250,
        opacity: [1, 0],
        targets: this.content,
      })
      .add({
        ...Prompt.defaultAnimationSettings,
        begin: () => {
          if (this.modal) {
            this.modal.style.display = 'block';
          }
        },
        delay: 500,
        duration: 250,
        opacity: [0, 1],
        targets: this.modal,
      })
      .play();
  }

  onLaterClick(event: React.MouseEvent<HTMLElement>): void {
    this.onDecisionTaken({
      allow: false,
      installAutomatically: false,
      skipThisUpdate: false,
    });
  }

  toggleCheckbox(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({
      decision: {
        ...this.state.decision,
        installAutomatically: event.target.checked,
      },
    });
  }

  render() {
    // Custom markdown
    const heading = props => {
      switch (props.level) {
        case 1:
          return <H1>{props.children}</H1>;
        case 2:
          return <H2>{props.children}</H2>;
        case 3:
          return <H3>{props.children}</H3>;
        case 4:
          return <H4>{props.children}</H4>;
        case 5:
          return <H5>{props.children}</H5>;
        case 6:
          return <H6>{props.children}</H6>;
      }
    };

    const paragraph = props => {
      return <Paragraph>{props.children}</Paragraph>;
    };

    // Build title and description
    let title: string;
    let description: string;
    if (this.state.isWebappTamperedWith) {
      title = 'Wire needs to be reinstalled';
      description =
        'We detected that internal components of Wire are corrupted and needs to be reinstalled. You will not lose your datas.';
    } else if (this.state.isWebappBlacklisted) {
      title = 'Your version of Wire is outdated';
      description = 'To continue using Wire, please update to the latest version.';
    } else {
      title = 'A new version of Wire is available';
      description = 'Update to latest version for the best Wire Desktop experience.';
    }

    return (
      <StyledApp className="node">
        {this.state.metadata !== null ? (
          <div className="modal" style={{display: 'none'}} ref={elem => (this.modal = elem)}>
            <Modal fullscreen onClose={this.hideChangelog}>
              <div>
                <H2>What's new</H2>
                <Paragraph>
                  {this.state.metadata.changelog !== '' ? (
                    <Markdown source={this.state.metadata.changelog} renderers={{heading, paragraph}} />
                  ) : (
                    <Small>No changelog is available for this update</Small>
                  )}
                </Paragraph>
                {this.state.changelogUrl !== '' ? (
                  <Paragraph>
                    <Link
                      fontSize="14px"
                      textTransform="normal"
                      style={{fontWeight: 'normal'}}
                      href={this.state.changelogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      color={COLOR.BLUE}
                    >
                      See changelog for older versions
                    </Link>
                  </Paragraph>
                ) : (
                  ''
                )}
                <Paragraph className="selectable" style={{wordBreak: 'break-all', marginBottom: 0}}>
                  <Text bold>Version:</Text> {this.state.metadata.webappVersionNumber}
                  <br />
                  <Text bold>Released on:</Text>{' '}
                  {DateTime.fromISO(this.state.metadata.releaseDate, {zone: 'utc'})
                    .setLocale('en-US')
                    .toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS)}
                  <br />
                  <Text bold>Size of the update:</Text>{' '}
                  {(
                    new Long(
                      this.state.metadata.fileContentLength.low,
                      this.state.metadata.fileContentLength.high,
                      this.state.metadata.fileContentLength.unsigned
                    ).toNumber() / 1000000
                  ).toFixed(2)}{' '}
                  MB
                  <br />
                  <Text bold>Checksum of the update:</Text> {this.state.metadata.fileChecksum.toString('hex')}
                  <br />
                  <Text bold>This update is digitally signed.</Text>
                </Paragraph>
              </div>
            </Modal>
          </div>
        ) : (
          ''
        )}
        <div ref={elem => (this.content = elem)}>
          <Content className="content" style={{padding: '24px 34px'}}>
            <H2>{title}</H2>
            <Paragraph>
              {description}{' '}
              <Link
                fontSize="16px"
                textTransform="normal"
                style={{fontWeight: 'normal'}}
                onClick={this.showChangelog}
                color={COLOR.BLUE}
              >
                Learn more about this update
              </Link>
            </Paragraph>
            <Paragraph>
              <Checkbox
                checked={this.state.isUpdatesInstallAutomatically}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => this.toggleCheckbox(event)}
              >
                <Text fontSize="14px">Install Wire updates automatically in the future</Text>
              </Checkbox>
            </Paragraph>
            <Container className="decision">
              <ButtonLink
                style={{marginBottom: '0px'}}
                backgroundColor={COLOR.WHITE}
                color={COLOR.GRAY_DARKEN_72}
                onClick={this.onLaterClick}
              >
                {this.state.isWebappBlacklisted || this.state.isWebappTamperedWith ? 'Quit' : 'Later'}
              </ButtonLink>
              <ButtonLink style={{marginBottom: '0px'}} onClick={this.onUpdateClick}>
                {this.state.isWebappTamperedWith ? 'Reinstall' : 'Update'}
              </ButtonLink>
            </Container>
          </Content>
        </div>
      </StyledApp>
    );
  }
}

export default Prompt;
