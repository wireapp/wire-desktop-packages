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
import {COLOR, Checkbox, CheckboxLabel, Container, Link, Opacity, Paragraph} from '@wireapp/react-ui-kit';
import * as React from 'react';
import {EventDispatcher} from '../libs/EventDispatcher';
import {PromptContainerState} from './Prompt';
import {PromptChangelogModal} from './PromptChangelogModal';
import {DecisionButton, GlobalStyle, MainContent, MainHeading, UpdaterContainer} from './UpdaterStyles';

interface Props extends PromptContainerState {}

interface State {
  decision: Updater.Decision;
  isUpdatesInstallAutomatically: boolean;
  showChangelog: boolean;
}

class Prompt extends React.Component<Props, State> {
  state = {
    decision: {
      allow: false,
      installAutomatically: false,
    },
    isUpdatesInstallAutomatically: false,
    showChangelog: false,
  };

  public static TOPIC = {
    SEND_DECISION: 'Prompt.TOPIC.SEND_DECISION',
    SEND_RESIZE_BROWSER_WINDOW: 'Prompt.TOPIC.SEND_RESIZE_BROWSER_WINDOW',
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.showChangelog !== prevState.showChangelog) {
      EventDispatcher.send(
        Prompt.TOPIC.SEND_RESIZE_BROWSER_WINDOW,
        this.state.showChangelog ? PromptChangelogModal.CHANGELOG_WINDOW_SIZE : PromptChangelogModal.PROMPT_WINDOW_SIZE
      );
    }
  }

  onDecisionTaken = (userDecision: Partial<any>): void => {
    const decision = {...this.state.decision, ...userDecision};
    EventDispatcher.send(Prompt.TOPIC.SEND_DECISION, decision);
  };

  onUpdateClick = (event: React.MouseEvent<HTMLElement>): void => {
    this.onDecisionTaken({
      allow: true,
    });
  };

  onLaterClick = (): void => {
    this.onDecisionTaken({
      allow: false,
      installAutomatically: false,
    });
  };

  toggleCheckbox = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({
      decision: {
        ...this.state.decision,
        installAutomatically: event.target.checked,
      },
      isUpdatesInstallAutomatically: event.target.checked,
    });
  };

  toggleChangelog = (event?: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState(state => ({
      showChangelog: !state.showChangelog,
    }));
  };

  render() {
    const {isWebappTamperedWith, isWebappBlacklisted, manifest, changelogUrl} = this.props;
    let title: string;
    let description: string;
    if (isWebappTamperedWith) {
      title = 'Wire needs to be reinstalled';
      description =
        'We detected that internal components of Wire are corrupted and needs to be reinstalled. You will not lose your data.';
    } else if (isWebappBlacklisted) {
      title = 'Your version of Wire is outdated';
      description = 'To continue using Wire, please update to the latest version.';
    } else {
      title = 'A new version of Wire is available';
      description = 'Update to latest version for the best Wire Desktop experience.';
    }
    return (
      <UpdaterContainer>
        <Opacity in={manifest && this.state.showChangelog} mountOnEnter={false} unmountOnExit={true}>
          <PromptChangelogModal
            onClose={() => this.toggleChangelog()}
            manifest={manifest}
            changelogUrl={changelogUrl}
          />
        </Opacity>
        <Opacity in={!this.state.showChangelog}>
          <MainContent style={{width: '480px'}}>
            <MainHeading>{title}</MainHeading>
            <Paragraph>
              {description}
              <Link
                fontSize="16px"
                textTransform="normal"
                style={{fontWeight: 'normal'}}
                onClick={this.toggleChangelog}
                color={COLOR.BLUE}
              >
                {' Learn more about this update'}
              </Link>
            </Paragraph>
            {!isWebappTamperedWith && (
              <Paragraph>
                <Checkbox checked={this.state.isUpdatesInstallAutomatically} onChange={this.toggleCheckbox}>
                  <CheckboxLabel>{'Install Wire updates automatically in the future'}</CheckboxLabel>
                </Checkbox>
              </Paragraph>
            )}
            <Container>
              <DecisionButton backgroundColor={COLOR.WHITE} color={COLOR.GRAY_DARKEN_72} onClick={this.onLaterClick}>
                {isWebappBlacklisted || isWebappTamperedWith ? 'Quit' : 'Later'}
              </DecisionButton>
              <DecisionButton backgroundColor={COLOR.BLUE} onClick={this.onUpdateClick}>
                {isWebappTamperedWith ? 'Reinstall' : 'Update'}
              </DecisionButton>
            </Container>
          </MainContent>
        </Opacity>
        <GlobalStyle />
      </UpdaterContainer>
    );
  }
}

export {Prompt};
