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

// Note: It is important that nock is called first
import nock from 'nock';

import * as assert from 'assert';
//import * as https from 'https';
import {Request, buildCert} from './Networking';
//import {ConfigServer} from './index';
//import {Utils} from './Utils';
//import * as path from 'path';

describe('Networking', () => {
  describe('buildCert', () => {
    it('return a valid pem-encoded certificate', () => {
      const value = Buffer.from('certificate');
      const expected = '-----BEGIN CERTIFICATE-----\nY2VydGlmaWNhdGU=\n-----END CERTIFICATE-----';
      assert.strictEqual(buildCert({raw: value}), expected);
    });
  });
  
  describe('Request', () => {
    describe('doRemote', () => {
      it('can do a remote request', async () => {
        const scope = nock('https://wire.com')
          .get('/mocha')
          .reply(200, 'success');
        await Request.doRemote({url: 'https://wire.com/mocha'});
        scope.done();
      });

             /*try {
        https.createServer({
          cert: ConfigServer.WEB_SERVER_HOST_CERTIFICATE,
          ciphers: 'ECDHE-RSA-AES128-GCM-SHA256',
          key: ConfigServer.WEB_SERVER_HOST_PRIVATE_KEY,
          secureProtocol: 'TLSv1_2_method',
        }, (req, res) => {
          setTimeout(() => {
            req.socket.destroy()
          }, 4000)
          
        }).listen(38491, '127.0.0.1');
      } catch (error) {}*/
      /*it('cancel the connection when socket takes too long to connect', function (done) {
        // Note: Nock is not capable of handling this test case, use a normal nodejs server
        this.timeout(50000);
 

        const serv = require('net').createServer({pauseOnConnect: true});
        serv.on('connection', socket => {
          serv.close();
        })
        serv.on('listening', async () => {
          console.log(await Request.doLocal({url: `https://127.0.0.1:${serv.address().port}`}, 'accessTokenDummy'));
          done();
        })
        serv.listen(0, '127.0.0.1')
      });*/
    });

    describe('doLocal', () => {
      it('can do a local request', async () => {
        const scope = nock('https://127.0.0.1:43912/')
          .get('/mocha')
          .reply(200, 'success');
        await Request.doLocal({url: 'https://127.0.0.1:43912/mocha'}, 'accessTokenDummy');
        scope.done();
      });
    });
  });
});
