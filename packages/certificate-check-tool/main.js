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

const certutils = require('@wireapp/certificate-check');
const electron = require('electron');
const https = require('https');

const {app, ipcMain} = electron;
const BrowserWindow = electron.BrowserWindow;

const platform = {
  IS_LINUX: process.platform === 'linux',
  IS_MAC_OS: process.platform === 'darwin',
  IS_WINDOWS: process.platform === 'win32',
};

let mainWindow = null;

const buildCert = cert => `-----BEGIN CERTIFICATE-----\n${cert.raw.toString('base64')}\n-----END CERTIFICATE-----`;

const connect = hostname => {
  return new Promise(resolve => {
    https
      .get(`https://${hostname}`)
      .on('socket', socket => {
        socket.on('secureConnect', () => {
          const cert = socket.getPeerCertificate(true);
          const certData = {
            data: buildCert(cert),
            issuerCert: {
              data: buildCert(cert.issuerCertificate),
            },
          };
          resolve({certData, hostname});
        });
      })
      .on('error', err => {
        console.error(err);
        resolve({certData: {}, hostname});
      });
  });
};

const verifyHosts = async hostnames => {
  const certPromises = hostnames.map(hostname => connect(hostname));

  const objects = await Promise.all(certPromises);

  objects.forEach(({certData, hostname}) => {
    const result = certutils.verifyPinning(hostname, certData);
    mainWindow.webContents.send('result', {hostname, result});
  });
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
  });

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

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

if (platform.IS_LINUX) {
  app.disableHardwareAcceleration();
}
