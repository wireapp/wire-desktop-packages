/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
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

//@ts-check

/**
 * @typedef {import('tls').DetailedPeerCertificate} PeerCertificate
 * @typedef {import('tls').TLSSocket} TLSSocket
 * @typedef {import('@wireapp/certificate-check').ElectronCertificate} ElectronCertificate
 * @typedef {{certData: ElectronCertificate, error?: string, hostname: string}} ConnectionResult
 */

const certutils = require('@wireapp/certificate-check');
const {app, BrowserWindow, ipcMain} = require('electron');
const https = require('https');
const minimist = require('minimist');
const argv = minimist(process.argv.slice(1));

let mainWindow = null;

/**
 * @param {PeerCertificate} cert - The certificate to build
 * @returns {string} The built certificate
 */
const buildCert = cert => `-----BEGIN CERTIFICATE-----\n${cert.raw.toString('base64')}\n-----END CERTIFICATE-----`;

/**
 * @param {string} hostname - The hostname to connect to
 * @returns {Promise<ConnectionResult | null>} The result
 */
const connect = hostname => {
  return new Promise(resolve => {
    https
      .get({
        host: hostname,
        protocol: 'https:',
      })
      .on('socket', (/** @type {TLSSocket} */ socket) => {
        socket.on('secureConnect', () => {
          const cert = socket.getPeerCertificate(true);
          /** @type {ElectronCertificate} */
          const certData = {
            data: buildCert(cert),
            issuerCert: {
              data: buildCert(cert.issuerCertificate),
            },
          };
          resolve({certData, hostname});
        });
      })
      .on('error', error => {
        console.error(error);
        resolve({certData: null, error: error.message, hostname});
      });
  });
};

/**
 * @param {string[]} hostnames - The hostnames to verify
 * @returns {Promise<void>} When all hostnames are checked
 */
const verifyHosts = async hostnames => {
  const certificates = await Promise.all(hostnames.map(connect));

  for (const {certData, error, hostname} of certificates) {
    const result = certutils.verifyPinning(hostname, certData);
    mainWindow.webContents.send('result', {error, hostname, result});
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    width: 800,
  });

  if (argv.devtools) {
    mainWindow.webContents.openDevTools({mode: 'detach'});
  }

  mainWindow.on('closed', () => (mainWindow = null));

  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('dom-ready', () => {
    const hostnames = [
      'app.wire.com',
      'prod-assets.wire.com',
      'prod-nginz-https.wire.com',
      'prod-nginz-ssl.wire.com',
      'wire.com',
    ];
    mainWindow.show();
    ipcMain.on('html-ready', () => {
      mainWindow.webContents.send('hostnames', hostnames);
      verifyHosts(hostnames);
    });
  });
};

app.on('ready', () => createWindow());
app.on('window-all-closed', () => app.quit());
app.on('activate', () => mainWindow === null && createWindow());
