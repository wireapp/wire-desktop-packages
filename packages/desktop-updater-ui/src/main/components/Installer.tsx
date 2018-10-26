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

import * as React from 'react';
import {Installer} from './InstallerView';

interface ProgressInterface {
  elapsed: number;
  percent?: number;
  remaining?: number;
  speed: number; // in bytes
  startedAt: number;
  total: number;
  transferred: number;
}

export interface InstallerContainerState {
  progress: ProgressInterface;
  installing: boolean;
}

interface Props {}

class InstallerContainer extends React.Component<Props, InstallerContainerState> {
  state = {
    installing: false,
    progress: {
      elapsed: 0,
      percent: undefined,
      remaining: undefined,
      speed: 0,
      startedAt: 0,
      total: 0,
      transferred: 0,
    },
  };

  public static TOPIC = {
    ON_PROGRESS: 'Installer.TOPIC.ON_PROGRESS',
  };

  componentDidMount(): void {
    window.addEventListener(InstallerContainer.TOPIC.ON_PROGRESS, this.updateProgress, false);
  }

  componentWillUnmount(): void {
    window.removeEventListener(InstallerContainer.TOPIC.ON_PROGRESS, this.updateProgress);
  }

  updateProgress = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const detail: ProgressInterface = customEvent.detail;

    if (detail.percent === 1) {
      return this.finishedProgress();
    }
    this.setState({progress: detail});
  };

  finishedProgress = (): void => {
    this.setState({
      installing: true,
      progress: {
        ...this.state.progress,
        percent: undefined,
      },
    });
  };

  render() {
    return <Installer {...this.state} />;
  }
}

export {InstallerContainer};
