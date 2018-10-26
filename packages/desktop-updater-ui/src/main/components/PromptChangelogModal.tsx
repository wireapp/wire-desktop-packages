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
import {COLOR, H1, H2, H3, H4, Link, Opacity, Paragraph, Small, Text} from '@wireapp/react-ui-kit';
import * as anime from 'animejs';
import * as Long from 'long';
import {DateTime} from 'luxon';
import * as React from 'react';
import * as Markdown from 'react-markdown';
import {EventDispatcher} from '../libs/EventDispatcher';
import {Modal} from './ModalBack';
import {MainHeading, SelectableParagraph} from './UpdaterStyles';

interface Props {
  metadata: any;
  changelogUrl: string;
  onClose: () => void;
}

interface State {
  decision: Updater.Decision;
  isUpdatesInstallAutomatically: boolean;
}

class PromptChangelogModal extends React.Component<Props, State> {
  private static readonly PROMPT_WINDOW_SIZE = {height: 287, width: 480};
  private static readonly CHANGELOG_WINDOW_SIZE = {height: Math.round(289 * 1.4), width: Math.round(480 * 1.3)};
  // private static readonly defaultAnimationSettings = {easing: 'easeInOutSine'};

  // private modal: HTMLElement | null = null;

  public static TOPIC = {
    SEND_RESIZE_BROWSER_WINDOW: 'PromptChangelogModal.TOPIC.SEND_RESIZE_BROWSER_WINDOW',
  };

  componentDidMount() {
    // anime({
    //   ...PromptChangelogModal.defaultAnimationSettings,
    //   delay: 1000,
    //   duration: 250,
    //   opacity: [0, 1],
    //   targets: this.content,
    // });
  }

  hideChangelog = (): void => {
    // if (this.modal) {
    //   this.modal.style.display = 'none';
    // }

    EventDispatcher.send(
      PromptChangelogModal.TOPIC.SEND_RESIZE_BROWSER_WINDOW,
      PromptChangelogModal.PROMPT_WINDOW_SIZE
    );
    this.props.onClose();
    // const timeline = anime.timeline({
    //   autoplay: false,
    //   direction: 'normal',
    // });

    // timeline
    //   .add({
    //     ...PromptChangelogModal.defaultAnimationSettings,
    // complete: () => {
    //   if (this.modal) {
    //     this.modal.style.display = 'none';
    //   }
    //       EventDispatcher.send(PromptChangelogModal.TOPIC.SEND_RESIZE_BROWSER_WINDOW, PromptChangelogModal.PROMPT_WINDOW_SIZE);
    //     },
    //     duration: 250,
    //     opacity: [1, 0],
    //     targets: this.modal,
    //   })
    //   .add({
    //     ...PromptChangelogModal.defaultAnimationSettings,
    //     begin: () => {
    //       if (this.content) {
    //         this.content.style.display = 'block';
    //       }
    //     },
    //     delay: 500,
    //     duration: 250,
    //     opacity: [0, 1],
    //     targets: this.content,
    //   })
    //   .play();
  };

  showChangelog = (): void => {
    EventDispatcher.send(
      PromptChangelogModal.TOPIC.SEND_RESIZE_BROWSER_WINDOW,
      PromptChangelogModal.CHANGELOG_WINDOW_SIZE
    );
    // if (this.modal) {
    //   this.modal.style.display = 'block';
    // }

    // const timeline = anime.timeline({
    //   autoplay: false,
    //   direction: 'normal',
    // });

    // timeline
    //   .add({
    //     ...PromptChangelogModal.defaultAnimationSettings,
    //     complete: () => {
    //       EventDispatcher.send(PromptChangelogModal.TOPIC.SEND_RESIZE_BROWSER_WINDOW, PromptChangelogModal.CHANGELOG_WINDOW_SIZE);
    //       if (this.content) {
    //         this.content.style.display = 'none';
    //       }
    //     },
    //     duration: 250,
    //     opacity: [1, 0],
    //     targets: this.content,
    //   })
    //   .add({
    //     ...PromptChangelogModal.defaultAnimationSettings,
    //     begin: () => {
    //       if (this.modal) {
    //         this.modal.style.display = 'block';
    //       }
    //     },
    //     delay: 500,
    //     duration: 250,
    //     opacity: [0, 1],
    //     targets: this.modal,
    //   })
    //   .play();
  };

  render() {
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
    return (
      <Modal fullscreen onClose={this.hideChangelog} style={{backgroundColor: 'white'}}>
        <MainHeading>{"What's new"}</MainHeading>
        {this.props.metadata.targetEnvironment !== 'PRODUCTION' ? (
          <Paragraph style={{marginBottom: 10}}>
            <Text fontSize="12px" bold style={{backgroundColor: COLOR.RED, padding: 5}} color={COLOR.WHITE}>
              {'WARNING'}
            </Text>
            <Text fontSize="14px" bold color={COLOR.RED}>
              {` This release is intended for ${this.props.metadata.targetEnvironment.toLowerCase()} environment only.`}
            </Text>
          </Paragraph>
        ) : null}
        <Paragraph>
          {this.props.metadata.changelog !== '' ? (
            <Markdown
              escapeHtml={true}
              skipHtml={true}
              source={this.props.metadata.changelog}
              renderers={{heading, paragraph: Paragraph}}
            />
          ) : (
            <Small>{'No changelog is available for this update'}</Small>
          )}
        </Paragraph>
        {this.props.changelogUrl && (
          <Paragraph>
            <Link
              fontSize="14px"
              textTransform="normal"
              style={{fontWeight: 'normal'}}
              href={this.props.changelogUrl}
              target="_blank"
              rel="noopener noreferrer"
              color={COLOR.BLUE}
            >
              {'See changelog for older versions'}
            </Link>
          </Paragraph>
        )}
        <SelectableParagraph fontSize="14px">
          <Text fontSize="14px" bold>
            {'Version: '}
          </Text>
          {this.props.metadata.webappVersionNumber}
          <br />
          <Text fontSize="14px" bold>
            {'Released on: '}
          </Text>
          {DateTime.fromISO(this.props.metadata.releaseDate, {zone: 'utc'})
            .setLocale('en-US')
            .toLocaleString(DateTime.DATETIME_HUGE_WITH_SECONDS)}
          <br />
          <Text fontSize="14px" bold>
            {'Size of the update: '}
          </Text>
          {(
            new Long(
              this.props.metadata.fileContentLength.low,
              this.props.metadata.fileContentLength.high,
              this.props.metadata.fileContentLength.unsigned
            ).toNumber() / 1000000
          ).toFixed(2)}
          {' MB'}
          <br />
          <Text fontSize="14px" bold>
            {'Checksum of the update: '}
          </Text>
          {this.props.metadata.fileChecksum.toString('hex')}
          <br />
          <Text fontSize="14px" bold>
            {'This update is digitally signed.'}
          </Text>
        </SelectableParagraph>
      </Modal>
    );
  }
}

export {PromptChangelogModal};
