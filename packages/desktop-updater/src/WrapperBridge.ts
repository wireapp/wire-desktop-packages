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

import {BridgeIPC} from '@wireapp/desktop-updater-spec';
import {ipcRenderer} from 'electron';

export function UpdaterBridgeIPC(): void {
  ipcRenderer.on(BridgeIPC.UPDATE_AVAILABLE, (event, detail) =>
    window.dispatchEvent(new CustomEvent(BridgeIPC.UPDATE_AVAILABLE, {detail}))
  );
  ipcRenderer.on(BridgeIPC.UPDATE_INSTALLED, (event, detail) =>
    window.dispatchEvent(new CustomEvent(BridgeIPC.UPDATE_INSTALLED, {detail: null}))
  );
  ipcRenderer.on(BridgeIPC.UPDATE_START_INSTALL, (event, detail) =>
    window.dispatchEvent(new CustomEvent(BridgeIPC.UPDATE_START_INSTALL, {detail}))
  );
  ipcRenderer.on(BridgeIPC.UPDATE_END_INSTALL, (event, detail) =>
    window.dispatchEvent(new CustomEvent(BridgeIPC.UPDATE_END_INSTALL, {detail: null}))
  );

  window.addEventListener(BridgeIPC.UPDATE_AVAILABLE_ACK, event =>
    ipcRenderer.send(BridgeIPC.UPDATE_AVAILABLE_ACK, (event as CustomEvent).detail)
  );
  window.addEventListener(BridgeIPC.UPDATE_AVAILABLE_DISPLAY, event =>
    ipcRenderer.send(BridgeIPC.UPDATE_AVAILABLE_DISPLAY, (event as CustomEvent).detail)
  );
}
