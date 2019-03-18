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

import {ipcRenderer} from 'electron';

// Hacks: Fix export / module issue encountered with Typescript and Electron preload script
// "Uncaught ReferenceError: exports is not defined."
// https://github.com/Microsoft/TypeScript/issues/14351#issuecomment-283367126
export = 0;
// @ts-ignore: 'module' is declared but its value is never read.
const module = <any>{export: 0};

// Updater-related
ipcRenderer.on('update-available', (event, detail) =>
  window.dispatchEvent(new CustomEvent('update-available', {detail}))
);
ipcRenderer.on('update-installed', (event, detail) =>
  window.dispatchEvent(new CustomEvent('update-installed', {detail: null}))
);
ipcRenderer.on('update-start-install', (event, detail) =>
  window.dispatchEvent(new CustomEvent('update-start-install', {detail}))
);
ipcRenderer.on('update-end-install', (event, detail) =>
  window.dispatchEvent(new CustomEvent('update-end-install', {detail: null}))
);
window.addEventListener('update-available-ack', event =>
  ipcRenderer.send('update-available-ack', (event as CustomEvent).detail)
);
window.addEventListener('update-available-display', event =>
  ipcRenderer.send('update-available-display', (event as CustomEvent).detail)
);
