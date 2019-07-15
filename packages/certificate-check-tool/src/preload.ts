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

import {Event, ipcRenderer, shell} from 'electron';
import * as os from 'os';
import {VerificationResult, ipcChannel} from './main';

function isReady(callback: () => void): void {
  const documentReady =
    document.readyState === 'complete' ||
    (document.readyState !== 'loading' && !(document.documentElement as any).doScroll);
  if (documentReady) {
    callback();
  } else {
    window.addEventListener('load', callback);
  }
}

const createElement = (type: string, options: Record<string, string>) => {
  const element = document.createElement(type);
  Object.assign(element, options);
  return element;
};

let log = `--- Wire Certificate Check log from ${new Date().toISOString()} on ${os.platform()} ${os.arch()} ---\n\n`;

isReady(() => {
  const divHostnames = document.getElementById('hostnames');

  ipcRenderer.on(ipcChannel.HOSTNAMES, (event: Event, hostnames: string[]) =>
    hostnames.forEach(hostname => {
      const divHostname = createElement('div', {id: `host-${hostname.replace(/\./g, '-')}`});
      const spanStatus = createElement('span', {className: 'status'});
      const spanHostname = createElement('span', {innerText: hostname});

      divHostname.appendChild(spanStatus);
      divHostname.appendChild(spanHostname);
      divHostnames!.appendChild(divHostname);
    }),
  );

  ipcRenderer.on(ipcChannel.RESULT, (event: Event, data: VerificationResult) => {
    const {hostname, error: getError, result} = data;
    const {errorMessage = '', verifiedPublicKeyInfo} = result;
    let icon: string;

    if (verifiedPublicKeyInfo === true) {
      icon = '✔️';
    } else {
      icon = '❌';
      const spanResult = document.getElementById('result');
      const pResultText = document.getElementById('result-text');

      if (!pResultText) {
        const pText = createElement('p', {id: 'result-text', innerText: 'At least one check failed.'});
        spanResult!.appendChild(pText);
        document.getElementById('sendmail')!.style.display = 'block';
      }

      log += `*${hostname}*: ${errorMessage}\n`;
      log += `get error: ${getError}\n`;
      log += `\nRemote certificate:\n${JSON.stringify(result)}\n\n${'-'.repeat(66)}\n\n`;
    }

    const query = `#host-${hostname.replace(/\./g, '-')} .status`;
    document.querySelector(query)!.innerHTML = icon;
  });

  document.getElementById('sendmail')!.addEventListener('click', async event => {
    event.preventDefault();
    const subject = encodeURIComponent('Certificate Check Report');
    const body = encodeURIComponent(log);
    const mailToLink = `mailto:support+web@wire.com?subject=${subject}&body=${body}`;
    await shell.openExternal(mailToLink);
  });

  ipcRenderer.send('html-ready');
});
