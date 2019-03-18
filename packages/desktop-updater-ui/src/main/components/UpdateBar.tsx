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
import {EventDispatcher} from '../libs/EventDispatcher';
import i18n from '../libs/Localization';

// replace with styled component
import '../../../src/main/components/legacy_UpdaterBar.css';

interface UpdateBarState {
  isUpdateAvailable: boolean;
  screenshot?: string;
}

class UpdateBar extends React.Component<WithTranslation, UpdateBarState> {
  private readonly ANIMATION_DURATION = 2500;
  private readonly defaultAnimationSettings = {
    easing: 'easeInOutSine',
  };
  private screenshot: HTMLDivElement | null = null;

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
      targets: this.screenshot,
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
      targets: this.screenshot,
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
      <div className="UpdaterContainer">
        <div
          ref={elem => (this.screenshot = elem)}
          className={this.state.screenshot ? 'updater-freeze' : 'updater-freeze-hidden'}
        >
          <img
            src={
              typeof this.state.screenshot === 'string'
                ? this.state.screenshot
                : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6zwAAAgcBApocMXEAAAAASUVORK5CYII='
            }
          />
        </div>
        {this.state.isUpdateAvailable ? (
          <div className="updater-bar updater-bar-connection">
            <div className="updater-bar-message">
              <span>
                <Trans>A new version of Wire is available</Trans>
              </span>
              &nbsp;
              <a className="updater-bar-click" href="javascript://" onClick={this._onClickOnDetails}>
                <Trans>Learn more</Trans>
              </a>
            </div>
          </div>
        ) : (
          ''
        )}
        <div className={this.state.isUpdateAvailable ? 'updater-bar-resize' : 'updater-bar-no-resize'}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

const TranslatedUpdateBar = withTranslation()(UpdateBar);

export {UpdateBar, TranslatedUpdateBar};
