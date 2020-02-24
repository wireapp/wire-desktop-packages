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

declare const Config: {[key: string]: any};
declare const DocumentRoot: string;
declare const AccessToken: string;

import * as http from 'http';
import * as https from 'https';

import * as finalhandler from 'finalhandler';
import * as serveStatic from 'serve-static';

import * as Random from 'random-js';

// tslint:disable-next-line:no-console
const log = console.log;

export namespace LocalServer {
  export class Child {
    private internalHost: string | undefined;
    private server: https.Server | undefined;
    private serve: typeof serveStatic;

    private static readonly MAX_RETRY_BEFORE_REJECT = Config.MAX_RETRY_BEFORE_REJECT;
    private static readonly WEB_SERVER_CSP = Config.WEB_SERVER_CSP;
    private static readonly WEB_SERVER_HOST_CERTIFICATE = Config.WEB_SERVER_HOST_CERTIFICATE;
    private static readonly WEB_SERVER_HOST_LOCAL = Config.WEB_SERVER_HOST_LOCAL;
    private static readonly WEB_SERVER_HOST_PRIVATE_KEY = Config.WEB_SERVER_HOST_PRIVATE_KEY;
    private static readonly WEB_SERVER_LISTEN = Config.WEB_SERVER_LISTEN;
    private static readonly WEB_SERVER_LISTEN_PORT_MAX = Config.WEB_SERVER_LISTEN_PORT_MAX;
    private static readonly WEB_SERVER_LISTEN_PORT_MIN = Config.WEB_SERVER_LISTEN_PORT_MIN;
    private static readonly WEB_SERVER_TOKEN_NAME = Config.WEB_SERVER_TOKEN_NAME;

    constructor() {}

    public async start(): Promise<{
      internalHost: string | undefined;
    }> {
      // Set the given document root
      this.setDocumentRoot(DocumentRoot);

      this.server = https.createServer(
        {
          cert: LocalServer.Child.WEB_SERVER_HOST_CERTIFICATE,
          ciphers: 'ECDHE-RSA-AES128-GCM-SHA256',
          key: LocalServer.Child.WEB_SERVER_HOST_PRIVATE_KEY,
          secureProtocol: 'TLSv1_2_method',
        },
        (req: http.IncomingMessage, res: http.ServerResponse) => this.onRequest(req, res),
      );

      await this.listen();

      return {internalHost: this.internalHost};
    }

    private static endRequest(res: http.ServerResponse): void {
      (<any>res).socket.end();
      res.end();
    }

    private onRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
      const authorizationHeader = req.headers['authorization'];

      // Don't accept requests if accessToken or Authorization header is not a string
      if (typeof AccessToken !== 'string' || typeof authorizationHeader !== 'string') {
        log('Cancelled a request because the access token and/or authorization header was empty');
        return LocalServer.Child.endRequest(res);
      }

      // Check the token
      if (AccessToken !== authorizationHeader.substr(LocalServer.Child.WEB_SERVER_TOKEN_NAME.length + 1)) {
        log('Cancelled a request because the access token is invalid');
        return LocalServer.Child.endRequest(res);
      }

      // Serve the file
      this.serve(req, res, finalhandler(req, res));
    }

    private setDocumentRoot(documentRoot: string): void {
      // Prepare serveStatic to serve up the ASAR file
      this.serve = serveStatic(documentRoot, {
        index: ['index.html'],
        setHeaders: (res: http.ServerResponse, path: string) => {
          res.setHeader('X-Wire', 'Great Conversations.');

          // Add sec related headers
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'deny');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Referrer-Header', 'no-referrer');
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
          res.setHeader('Content-Security-Policy', LocalServer.Child.WEB_SERVER_CSP);

          // Disable caching
          res.setHeader('Cache-Control', 'no-cache');
        },
      });
    }

    public async stop(): Promise<void> {
      if (this.server) {
        this.server.close();
        log('Server has been shutdown.');
      }

      this.server = this.internalHost = undefined;
      log('Server has been stopped.');
    }

    private listen(retry: number = 0): Promise<void> {
      return new Promise((resolve, reject) => {
        // Ensure we do not reach the max retry limit
        if (retry >= LocalServer.Child.MAX_RETRY_BEFORE_REJECT) {
          return reject(new Error('Maximum attempts reached. Could not listen on a port, aborting.'));
        }

        // Ensure server is present
        if (!this.server) {
          return reject(new Error('Server var is not present, aborting.'));
        }

        // Get a random port
        const portToUse: number = Random.integer(
          LocalServer.Child.WEB_SERVER_LISTEN_PORT_MIN,
          LocalServer.Child.WEB_SERVER_LISTEN_PORT_MAX,
        )(Random.nodeCrypto);

        // Listen on the port
        return this.server
          .listen(portToUse, LocalServer.Child.WEB_SERVER_LISTEN, () => {
            // Server is now active
            this.internalHost = `https://${LocalServer.Child.WEB_SERVER_HOST_LOCAL}:${portToUse}`;

            log(`Listening on ${this.internalHost}, path: ${DocumentRoot}`);
            return resolve();
          })
          .once('error', (error: Error) => {
            log(`Unable to listen on port ${portToUse} (${error['code']}), retrying with another port...`);
            return this.listen(++retry);
          });
      });
    }
  }
}

// tslint:disable-next-line:no-default-export
export default async callback => {
  try {
    const server = new LocalServer.Child();
    const {internalHost} = await server.start();
    if (typeof internalHost === 'undefined') {
      throw new Error('Unable to get internal host. Server is likely not running.');
    }
    return callback({
      internalHost,
      // Only expose public functions
      server: {
        stop: server.stop.bind(server),
      },
    });
  } catch (error) {
    // tslint:disable-next-line:no-console
    log(error);
    return callback(false, error);
  }
};
