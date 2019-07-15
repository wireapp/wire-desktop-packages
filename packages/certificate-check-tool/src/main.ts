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

import {ElectronCertificate, PinningResult, verifyPinning} from '@wireapp/certificate-check';
import {BrowserWindow, app, ipcMain} from 'electron';
import * as https from 'https';
import * as minimist from 'minimist';
import * as path from 'path';
import {DetailedPeerCertificate, TLSSocket} from 'tls';

export interface ConnectionResult {
  certData?: ElectronCertificate;
  error?: string;
}

export interface VerificationResult {
  error?: string;
  hostname: string;
  result: PinningResult;
}

export enum ipcChannel {
  HOSTNAMES = 'hostnames',
  RESULT = 'result',
}

const argv = minimist(process.argv.slice(1));
const preloadFile = path.join(app.getAppPath(), 'dist/preload.js');

const hostnames = [
  'app.wire.com',
  'prod-assets.wire.com',
  'prod-nginz-https.wire.com',
  'prod-nginz-ssl.wire.com',
  'wire.com',
];

let mainWindow: BrowserWindow | null = null;

const buildCert = (cert: DetailedPeerCertificate): string => {
  return `-----BEGIN CERTIFICATE-----\n${cert.raw.toString('base64')}\n-----END CERTIFICATE-----`;
};

const connect = (hostname: string): Promise<ConnectionResult> => {
  return new Promise(resolve => {
    https
      .get({
        host: hostname,
        protocol: 'https:',
      })
      .on('socket', (socket: TLSSocket) => {
        socket.on('secureConnect', () => {
          const cert = socket.getPeerCertificate(true);
          const certData: ElectronCertificate = {
            data: buildCert(cert),
            issuerCert: {
              data: buildCert(cert.issuerCertificate),
            },
          };
          resolve({certData});
        });
      })
      .on('error', error => {
        console.error(error);
        resolve({error: error.message});
      });
  });
};

const verifyHosts = async (hostnames: string[]): Promise<void> => {
  const promises = hostnames.map(async hostname => {
    const {certData, error} = await connect(hostname);
    const result = verifyPinning(hostname, certData);
    if (mainWindow) {
      mainWindow.webContents.send('result', {error, hostname, result});
    }
  });

  await Promise.all(promises);
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: preloadFile,
    },
    width: 800,
  });

  if (argv.devtools) {
    mainWindow.webContents.openDevTools({mode: 'detach'});
  }

  mainWindow.on('closed', () => (mainWindow = null));

  await mainWindow.loadFile('index.html');

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow!.show();
    ipcMain.on('html-ready', async () => {
      mainWindow!.webContents.send(ipcChannel.HOSTNAMES, hostnames);
      await verifyHosts(hostnames);
    });
  });
};

app.on('ready', () => createWindow());
app.on('window-all-closed', () => app.quit());
app.on('activate', () => mainWindow === null && createWindow());
