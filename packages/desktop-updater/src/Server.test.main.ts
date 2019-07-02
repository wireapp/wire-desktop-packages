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

import * as assert from 'assert';
import * as path from 'path';
import {Sandbox, Server as UpdaterServer} from './Server';
import {Request} from './Networking';
import {Updater} from './Child';
import {ConfigServer as Config} from './Config';

const webConfig = {
  'ANALYTICS_API_KEY': '',
  'APP_NAME': 'Webapp',
  'BACKEND_REST': 'https://prod-nginz-https.wire.com',
  'BACKEND_WS': 'wss://prod-nginz-ssl.wire.com',
  'ENVIRONMENT': 'production',
  'FEATURE': {
    'CHECK_CONSENT': true,
    'ENABLE_ACCOUNT_REGISTRATION': true,
    'ENABLE_DEBUG': false,
    'ENABLE_PHONE_LOGIN': true,
    'ENABLE_SSO': true,
    'SHOW_LOADING_INFORMATION': false
  },
  'RAYGUN_API_KEY': 'M42DQTY4yMriY1JQcGOQ5Q',
  'URL': {
    'ACCOUNT_BASE': 'https://account.wire.com',
    'MOBILE_BASE': '',
    'PRIVACY_POLICY': 'https://wire.com/security',
    'SUPPORT_BASE': 'https://support.wire.com',
    'TEAMS_BASE': 'https://teams.wire.com',
    'TERMS_OF_USE_PERSONAL': 'https://wire.com/legal/terms/personal',
    'TERMS_OF_USE_TEAMS': 'https://wire.com/legal/terms/teams',
    'WEBSITE_BASE': 'https://wire.com'
  },
  'VERSION': '2019-05-16-09-26',
  'APP_BASE': 'https://app.wire.com'
};

const options = {
  browserWindowOptions: {},
  currentClientVersion: '3.9',
  currentEnvironment: 'PRODUCTION',
  currentEnvironmentBaseUrl: 'https://app.wire.com/',
  enableSecureUpdater: false,
  trustStore: [],
  updatesEndpoint: 'https://wire.com/updates',
  webConfig,
};

const documentRoot = path.join(__dirname, '..', '.test', 'documentRoot');

describe('Server', () => {
  let testServer: UpdaterServer;
  beforeEach(async () => {
    testServer = new UpdaterServer(options);
  });

  it('can generate a new local access token', async () => {
    assert.strictEqual((await testServer['generateToken']()).length, 171);
  });

  describe('createWebInstance', () => {
    let webInstance: Updater.Child;
    let url;
    let accessToken;
    let options;
    beforeEach(async () => {
      webInstance = await testServer.createWebInstance(documentRoot);
      url = testServer['internalHost'];
      url.pathname = 'mocha_test';
      accessToken = testServer['accessToken'];
      options = {url: url.toString(), responseType: 'text'};
    });
    afterEach(() => webInstance.stop());

    it('can access a webpage', async () => {
      const expected = 'this is a test from mocha';
      assert.strictEqual((await Request.doLocal(options, accessToken)).data, expected);
    });

    it('drops the connection when access token is invalid', async () => {
      try {
        await Request.doLocal(options, 'INVALID_TOKEN');
      } catch (error) {
        return assert.ok(error.message.includes('ALERT_HANDSHAKE_FAILURE'));
      }
      assert.fail();
    });
  });
});

describe('Sandbox', () => {
  let testSandbox: Sandbox;
  const webSandbox = path.join(__dirname, '..', 'dist', 'Child.js');
  const options = {
    AccessToken: 'accessToken',
    Config: Config,
    DocumentRoot: documentRoot,
    WebConfig: webConfig,
  };
  const newSandbox = (filename = webSandbox) => testSandbox = new Sandbox(filename, options);
  beforeEach(() => newSandbox());

  describe('run', () => {
    it('can run a new web server sandbox', async () => {
      const {internalHost, server} = await testSandbox.run();
      assert.strictEqual(typeof internalHost, 'string');
      await server.stop();
    });

    it('does not run with invalid config vars', async () => {
      testSandbox['options'].Config = {};
      let internalHost: string;
      try {
        internalHost = (await testSandbox.run()).internalHost;
      } catch (error) {}
      assert.strictEqual(internalHost, undefined);
    });

    it('does not run with invalid filename', async () => {
      newSandbox('invalid_filename');
      try {
        await testSandbox.run();
      } catch (error) {
        return assert.strictEqual(error.code, 'ENOENT');
      }
      assert.fail();
    });
  });
});
