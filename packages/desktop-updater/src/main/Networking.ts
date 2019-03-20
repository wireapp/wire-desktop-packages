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

import * as http from 'http';
import * as https from 'https';
import * as tls from 'tls';

import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import debug from 'debug';

import {hostnameShouldBePinned, verifyPinning} from '@wireapp/certificate-check';
import {session} from 'electron';
import {CookieManager} from './CookieManager';
import {Config} from './index';
import {UploadData} from './Utils';

const globalAxiosConfig: AxiosRequestConfig = {
  responseType: 'stream',
  timeout: 30000,
};

export const INTERCEPTED_PROTOCOL = 'https';

// Certificate pinning
const buildCert = cert => `-----BEGIN CERTIFICATE-----\n${cert.raw.toString('base64')}\n-----END CERTIFICATE-----`;
const httpsCertificatePinningMock = {
  ...https,
  request: (options: https.RequestOptions, callback?: (res: http.IncomingMessage) => void): http.ClientRequest => {
    const optionsWithPinning: https.RequestOptions & {checkServerIdentity: Function} = {
      ...options,
      checkServerIdentity: (hostname: string, cert: tls.DetailedPeerCertificate) => {
        // Make sure the certificate is issued to the host we are connected to
        const isCheckServerIdentityFailed = tls.checkServerIdentity(hostname, cert);
        if (isCheckServerIdentityFailed) {
          return isCheckServerIdentityFailed;
        }

        // Certificate pinning
        if (hostnameShouldBePinned(hostname)) {
          const certData = {
            data: buildCert(cert),
            issuerCert: {
              data: buildCert(cert.issuerCertificate),
            },
          };

          const pinningResults = verifyPinning(hostname, <any>certData);
          for (const result of Object.values(pinningResults)) {
            if (result === false) {
              return new Error(
                `Certificate verification failed for "${hostname}":\n${
                  pinningResults.errorMessage
                }, showing certificate pinning error dialog.`
              );
            }
          }
        }

        return;
      },
    };

    return https.request(optionsWithPinning, callback);
  },
};

class AgentManager {
  public static readonly httpsAgentsDefaults: Partial<https.AgentOptions> = {
    keepAlive: true,
    maxSockets: 6, // 6 max sockets per origin, from Chromium
    secureProtocol: 'TLSv1_2_method',
  };
  public static readonly httpsAgents: {
    local: https.Agent;
    remote: https.Agent;
  } = {
    local: new https.Agent({
      ...AgentManager.httpsAgentsDefaults,
      cert: Config.Server.WEB_SERVER_HOST_CERTIFICATE,
      ciphers: Config.Server.WEB_SERVER_CIPHERS,
      rejectUnauthorized: false,
    }),
    remote: new https.Agent({
      ...AgentManager.httpsAgentsDefaults,
    }),
  };
}

class Request {
  public static async doRemote<T>(
    config: AxiosRequestConfig,
    headers?: Electron.Headers,
    cookies?: string
  ): Promise<AxiosResponse<T>> {
    const options: AxiosRequestConfig & {transport: typeof httpsCertificatePinningMock} = {
      ...globalAxiosConfig,
      ...config,
      headers: {
        ...(headers ? headers : {}),
        ...(cookies ? {Cookie: cookies} : {}),
      },
      httpsAgent: AgentManager.httpsAgents.remote,
      transport: httpsCertificatePinningMock,
    };
    return axios(options);
  }
}

const debugIsInternetAvailable: typeof debug = debug('wire:server:isinternetavailable');

export const isInternetAvailable = async (url: string) => {
  debugIsInternetAvailable('Checking if "%s" is online...', url);
  try {
    await Request.doRemote(
      {
        ...globalAxiosConfig,
        method: 'HEAD',
        url,
      },
      {
        'User-Agent': session.defaultSession ? session.defaultSession.getUserAgent() : '',
      }
    );
  } catch (error) {
    if (!error.response) {
      debugIsInternetAvailable('Error while checking for internet connection');
      debugIsInternetAvailable(error);
      return false;
    }
  }
  return true;
};

const debugInterceptProtocol: typeof debug = debug('wire:server:interceptprotocol');

export const InterceptProtocol = async (
  ses: Electron.Session,
  internalHost: URL | undefined,
  accessToken: string | undefined,
  currentEnvironmentBaseUrlPlain: string,
  currentEnvironmentBaseUrl: URL
): Promise<void> => {
  if (!internalHost || !accessToken) {
    debugInterceptProtocol('Internal host or access token is not defined');
    throw new Error('Internal host or access token is not defined');
  }

  // Make sure we don't block requests on this webview
  ses.webRequest.onBeforeRequest({urls: [`${INTERCEPTED_PROTOCOL}://*`]}, <any>null);

  return new Promise((resolve, reject) =>
    ses.protocol.uninterceptProtocol(INTERCEPTED_PROTOCOL, () =>
      ses.protocol.interceptStreamProtocol(
        INTERCEPTED_PROTOCOL,
        async (request: Electron.InterceptStreamProtocolRequest, callback: Function) => {
          const {headers, method, url} = request;
          const isLocalServer = url.startsWith(currentEnvironmentBaseUrlPlain);

          let response: AxiosResponse;
          try {
            const uploadData =
              typeof request.uploadData !== 'undefined' ? await UploadData.getData(request.uploadData, ses) : undefined;
            const defaultConfig: AxiosRequestConfig = {
              ...globalAxiosConfig,
              data: uploadData,
              headers,
              method,
              url,
            };

            if (isLocalServer) {
              const parsedUrl = new URL(url);

              // Extra check for the origin
              if (parsedUrl.origin !== currentEnvironmentBaseUrl.origin) {
                throw new Error('Origin does not match');
              }

              // Prepare the URL to proxy to the local server
              const proxiedRequest = parsedUrl;
              proxiedRequest.protocol = internalHost.protocol;
              proxiedRequest.host = internalHost.host;

              debugInterceptProtocol('Forwarding "%s" request to "%s"', url, proxiedRequest.toString());

              const options: AxiosRequestConfig & {transport: typeof https} = {
                ...defaultConfig,
                headers: {
                  ...headers,
                  Authorization: `${Config.Server.WEB_SERVER_TOKEN_NAME} ${accessToken}`,
                },
                httpsAgent: AgentManager.httpsAgents.local,
                transport: https,
                url: proxiedRequest.toString(),
              };
              response = await axios(options);
            } else {
              // Anything else
              // Only get cookie outside the local server, we don't need it within
              const cookies = await CookieManager.get(url, ses);
              response = await Request.doRemote(defaultConfig, headers, cookies);
            }
          } catch (error) {
            if (error.response) {
              response = error.response;
            } else if (error.request) {
              debugInterceptProtocol('Error during the request. Aborting.');
              debugInterceptProtocol(error.request);
              return callback();
            } else {
              debugInterceptProtocol('Unknown error during the request. Aborting.');
              debugInterceptProtocol(error);
              return callback();
            }
          }

          // Workaround for https://github.com/electron/electron/issues/13228
          // Save the cookie to the session, if any
          await CookieManager.set(response.headers['set-cookie'], url, ses);

          // Call the callback within a setImmediate function
          // Otherwise it gets stuck for unknown reasons after setting the cookie
          setImmediate(() => {
            callback({
              data: response.data,
              headers: response.headers,
              statusCode: response.status,
            });
          });
        },
        error => {
          if (error) {
            debugInterceptProtocol('An error happened while intercepting the protocol');
            return reject(error);
          }
          resolve(error);
        }
      )
    )
  );
};
