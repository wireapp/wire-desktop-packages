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

import anime from 'animejs';
import * as React from 'react';
import {Trans, WithTranslation, withTranslation} from 'react-i18next';
import styled from 'styled-components';

import {EventDispatcher} from '../libs/EventDispatcher';
import i18n from '../libs/Localization';

interface UpdateBarState {
  isUpdateAvailable: boolean;
  screenshot?: string;
}
interface UpdaterAppContainerProps {
  resize: boolean;
}
interface UpdaterScreenshotContainerProps {
  freeze?: boolean;
}

const UpdaterContainer = styled.section`
  height: 100%;
  width: 100%;
`;

const UpdaterBar = styled.div`
  background-color: #18191b;
  color: #fff;
  display: flex;
  justify-content: center;
  width: 100%;

  -webkit-user-select: none;
  user-select: none;
  cursor: default;

  box-shadow: inset 0px -1px 0px 0px rgba(0, 0, 0, 0.2);

  text-transform: uppercase;
  font-size: 11px;
  font-weight: 400;
  height: 38.5px;
  justify-content: center;
`;

const UpdaterBarDetails = styled.a`
  color: #fff;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;

  &:hover,
  &:active {
    color: #fff;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
  }
`;

const UpdaterBarMessage = styled.div`
  display: flex;
  align-items: center;
`;

const UpdaterAppContainer = styled.div`
  height: ${(props: UpdaterAppContainerProps) => (props.resize ? 'calc(100% - 38.5px)' : '100%')};
`;

const UpdaterScreenshotContainer = styled.div`
  display: ${(props: UpdaterScreenshotContainerProps) => (props.freeze ? 'block' : 'none')};
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 20;
  opacity: 0;
  background: #000;
`;

const UpdaterScreenshot = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  -webkit-filter: grayscale(100%) blur(2px) opacity(0.7);
  filter: grayscale(100%) blur(2px) opacity(0.7);
`;

class UpdateBar extends React.Component<WithTranslation, UpdateBarState> {
  private readonly ANIMATION_DURATION = 2500;
  private readonly defaultAnimationSettings = {
    easing: 'easeInOutSine',
  };
  private screenshotElement: HTMLDivElement | null = null;

  constructor(props) {
    super(props);
    this.state = {
      isUpdateAvailable: false,
      screenshot: undefined,
    };
  }

  public async componentWillMount() {
    await i18n.changeLanguage('fr');
  }

  public componentDidMount() {
    window.addEventListener('update-available', this._onUpdateAvailable);
    window.addEventListener('update-start-install', this._onUpdateStartInstall);
    window.addEventListener('update-end-install', this._onUpdateEndInstall);
    window.addEventListener('update-installed', this._onUpdateInstalled);
  }

  private readonly _onUpdateStartInstall = event => {
    // Freeze window
    const screenshot = event.detail.screenshot;
    this.setState({
      screenshot,
    });
    anime({
      ...this.defaultAnimationSettings,
      duration: this.ANIMATION_DURATION,
      opacity: [0, 1],
      targets: this.screenshotElement,
    });
  };

  private readonly _onUpdateEndInstall = event => {
    // Unfreeze window
    anime({
      ...this.defaultAnimationSettings,
      complete: () =>
        this.setState({
          screenshot: undefined,
        }),
      delay: this.ANIMATION_DURATION * 2,
      duration: this.ANIMATION_DURATION / 2,
      opacity: [1, 0],
      targets: this.screenshotElement,
    });
  };

  private readonly _onUpdateAvailable = event => {
    this.setState({
      isUpdateAvailable: true,
    });
    EventDispatcher.send('update-available-ack');
  };

  private readonly _onUpdateInstalled = event => {
    this.setState({
      isUpdateAvailable: false,
    });
  };

  private readonly _onClickOnDetails = event => {
    event.preventDefault();
    EventDispatcher.send('update-available-display');
  };

  render() {
    return (
      <UpdaterContainer>
        <UpdaterScreenshotContainer
          ref={elem => (this.screenshotElement = elem)}
          freeze={this.state.screenshot ? true : false}
        >
          <UpdaterScreenshot
            src={
              typeof this.state.screenshot === 'string'
                ? this.state.screenshot
                : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6zwAAAgcBApocMXEAAAAASUVORK5CYII='
            }
          />
        </UpdaterScreenshotContainer>
        {this.state.isUpdateAvailable ? (
          <UpdaterBar>
            <UpdaterBarMessage>
              <span>
                <Trans>A new version of Wire is available</Trans>
              </span>
              &nbsp;
              <UpdaterBarDetails href="javascript://" onClick={this._onClickOnDetails}>
                <Trans>Learn more</Trans>
              </UpdaterBarDetails>
            </UpdaterBarMessage>
          </UpdaterBar>
        ) : (
          ''
        )}
        <UpdaterAppContainer resize={this.state.isUpdateAvailable}>{this.props.children}</UpdaterAppContainer>
      </UpdaterContainer>
    );
  }
}

const TranslatedUpdateBar = withTranslation()(UpdateBar);

export {UpdateBar, TranslatedUpdateBar};
