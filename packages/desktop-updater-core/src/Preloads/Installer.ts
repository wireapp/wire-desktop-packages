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

// Hacks: Fix export / module issue encountered with Typescript and Electron preload script
// "Uncaught ReferenceError: exports is not defined."
// https://github.com/Microsoft/TypeScript/issues/14351#issuecomment-283367126
export = 0;
// @ts-ignore: 'module' is declared but its value is never read.
const module = <any>{export: 0};

import {ProgressInterface} from '@wireapp/desktop-updater-spec';
import {ipcRenderer} from 'electron';

ipcRenderer.on('progress', (event, detail: ProgressInterface) =>
  window.dispatchEvent(new CustomEvent('Installer.TOPIC.ON_PROGRESS', {detail}))
);

ipcRenderer.once('onDataReceived', (sender, detail) =>
  window.dispatchEvent(new CustomEvent('onDataReceived', {detail}))
);
