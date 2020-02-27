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
import * as url from 'url';

import axios, {AxiosRequestConfig, AxiosResponse, Method as AxiosMethod} from 'axios';
const HttpsProxyAgent = require('https-proxy-agent');

import debug from 'debug';

import {hostnameShouldBePinned, verifyPinning} from '@wireapp/certificate-check';
import {Config} from './Config';
import {CookieManager} from './CookieManager';

export const INTERCEPTED_PROTOCOL = 'https';
export const TIMEOUT_SOCKET = 5000; // 5 seconds
export const TIMEOUT_REQUEST_RESPONSE_UPLOAD = 3600000; // 1 hour
export const TIMEOUT_REQUEST_RESPONSE = 120000; // 2 minutes

const globalAxiosConfig: AxiosRequestConfig = {
  responseType: 'stream',
  timeout: TIMEOUT_REQUEST_RESPONSE,
};

const debugCheckServerIdentity = debug('wire:server:checkserveridentity');

// Certificate pinning
const buildCert = cert => `-----BEGIN CERTIFICATE-----\n${cert.raw.toString('base64')}\n-----END CERTIFICATE-----`;

const httpsExtends = {
  ...https,
  request: (options: https.RequestOptions, callback?: (res: http.IncomingMessage) => void): http.ClientRequest => {
    const request = https.request(options, callback);

    // If the socket is inactive after X seconds
    // and we're still connecting, kill the socket
    request.once('socket', socket => {
      socket.setTimeout(TIMEOUT_SOCKET, () => {
        if (socket.connecting || socket.destroyed) {
          const error = 'Socket timed out';
          debugInterceptProtocol(error);
          // Pass the error to https://github.com/axios/axios/blob/master/lib/adapters/http.js#L242
          request.emit('error', new Error(error));
          // Note: Maybe we should also abort the request as well?
          // Issue is that the promise won't be rejected and since there no way to know if
          // Axios received the error, we would need our own adapter
          if (!socket.destroyed) {
            socket.destroy();
          }
        }
      });
    });

    return request;
  },
};

class UploadData {
  private static readonly debug = debug('wire:uploaddata');

  public static async getData(
    uploadData: Electron.UploadData[] | undefined,
    ses: Electron.Session,
  ): Promise<Buffer | undefined> {
    const data = uploadData ? uploadData[0] : {blobUUID: undefined, bytes: undefined};

    if (data.blobUUID) {
      UploadData.debug('Getting upload data Blob from UUID "%s"', data.blobUUID);
      return ses.getBlobData(data.blobUUID);
    }

    if (data.bytes) {
      UploadData.debug('Getting upload data bytes');
      return data.bytes;
    }

    return undefined;
  }
}

class AgentManager {
  public static readonly httpsAgentsDefaults: Partial<https.AgentOptions> = {
    keepAlive: true,
    maxSockets: 6, // 6 max sockets per origin, from Chromium
    minDHSize: 2048,
    rejectUnauthorized: true,
    secureProtocol: 'TLSv1_2_method',
  };
  public static readonly httpsAgentsOptions: {
    local: https.AgentOptions;
    remote: https.AgentOptions;
  } = {
    local: {
      ...AgentManager.httpsAgentsDefaults,
      ca: Config.Server.WEB_SERVER_HOST_CERTIFICATE,
      checkServerIdentity: (hostname: string, cert: tls.PeerCertificate) => {
        if (hostname !== Config.Server.WEB_SERVER_HOST_LOCAL) {
          return new Error('This agent can only be used for the local web server');
        }
        return undefined;
      },
      ciphers: Config.Server.WEB_SERVER_CIPHERS,
    },
    remote: {
      ...AgentManager.httpsAgentsDefaults,
      checkServerIdentity: (hostname: string, cert: tls.PeerCertificate) => {
        // Make sure the certificate is issued to the host we are connected to
        const isCheckServerIdentityFailed = tls.checkServerIdentity(hostname, cert);
        if (isCheckServerIdentityFailed) {
          debugCheckServerIdentity('Check failed for "%s"', hostname);
          return isCheckServerIdentityFailed;
        }

        // Certificate pinning
        if (hostnameShouldBePinned(hostname)) {
          debugCheckServerIdentity('Verifying pinning for "%s"', hostname);
          const certData = {
            data: buildCert(cert),
            issuerCert: {
              data: buildCert((cert as tls.DetailedPeerCertificate).issuerCertificate),
            },
          };

          const pinningResults = verifyPinning(hostname, <any>certData);
          for (const result of Object.values(pinningResults)) {
            if (result === false) {
              const error = `Certificate verification failed for "${hostname}":\n${pinningResults.errorMessage}, showing certificate pinning error dialog.`;

              debugCheckServerIdentity(error);
              return new Error(error);
            }
          }
          debugCheckServerIdentity('Pinning valid for "%s"', hostname);
        } else {
          debugCheckServerIdentity('Skipping certificate pinning check for "%s"', hostname);
        }

        return undefined;
      },
    },
  };

  public static httpsAgents = {
    local: new https.Agent(AgentManager.httpsAgentsOptions.local),
    remote: new https.Agent(AgentManager.httpsAgentsOptions.remote),
  };
};

// This will allow the proxy agent to be set after we init the local web server
function HotswapRemoteAgent(agentToReplaceWith: https.Agent): void {
  if (AgentManager.httpsAgents?.remote?.destroy) {
    AgentManager.httpsAgents.remote.destroy();
  }
  AgentManager.httpsAgents.remote = agentToReplaceWith;
}

const debugProxifyNetworkingLayer = debug('wire:server:proxifynetworkinglayer');

// Forward traffic to a HTTP(S) proxy server
let proxySet = false;
export function proxifyNetworkingLayer(proxyUrl: string | url.UrlWithStringQuery, overwrite: boolean = false): void {
  const {auth, hostname, port, protocol} = typeof proxyUrl === 'string' ? url.parse(proxyUrl) : proxyUrl;
  if (proxySet && !overwrite) {
    debugProxifyNetworkingLayer('The HTTPS remote agent is already using a proxy, use "overwrite" option to force it');
    return;
  }
  proxySet = true;

  debugProxifyNetworkingLayer('Hot swapping HTTPS remote agent...', {auth, hostname, port, protocol});
  HotswapRemoteAgent(
    new HttpsProxyAgent({
      ...AgentManager.httpsAgentsOptions.remote,
      auth,
      hostname,
      port,
      protocol,
      secureEndpoint: true,
      secureProxy: protocol === 'https:',
    })
  );
}

class Request {
  public static async doRemote<T>(config: AxiosRequestConfig, cookies?: string): Promise<AxiosResponse<T>> {
    const options: AxiosRequestConfig & {transport: typeof httpsExtends} = {
      ...globalAxiosConfig,
      ...config,
      headers: {
        ...(config.headers ? config.headers : {}),
        ...(cookies ? {Cookie: cookies} : {}),
      },
      httpsAgent: AgentManager.httpsAgents.remote,
      transport: httpsExtends,
    };
    return axios(options);
  }

  public static async doLocal<T>(config: AxiosRequestConfig, accessToken: string): Promise<AxiosResponse<T>> {
    const options: AxiosRequestConfig & {transport: typeof httpsExtends} = {
      ...globalAxiosConfig,
      ...config,
      headers: {
        ...config.headers,
        Authorization: `${Config.Server.WEB_SERVER_TOKEN_NAME} ${accessToken}`,
      },
      httpsAgent: AgentManager.httpsAgents.local,
      method: 'GET',
      transport: httpsExtends,
    };
    return axios(options);
  }
}

const debugInterceptProtocol = debug('wire:server:proxifyprotocol');

export const proxifyProtocol = async (
  ses: Electron.Session,
  internalHost: URL | undefined,
  accessToken: string | undefined,
  currentEnvironmentBaseUrlPlain: string,
  currentEnvironmentBaseUrl: URL,
): Promise<void> => {
  if (!internalHost || !accessToken) {
    debugInterceptProtocol('Internal host or access token is not defined');
    throw new Error('Internal host or access token is not defined');
  }

  return new Promise((resolve, reject) =>
    ses.protocol.uninterceptProtocol(INTERCEPTED_PROTOCOL, () =>
      ses.protocol.interceptStreamProtocol(
        INTERCEPTED_PROTOCOL,
        async (request: Electron.Request, callback: Function) => {
          const {headers, method, url} = request as {headers: Record<string, string>; method: AxiosMethod; url: string};
          const isLocalServer = url.startsWith(currentEnvironmentBaseUrlPlain);

          let response: AxiosResponse;
          try {
            if (isLocalServer) {
              // Prepare the URL to proxy to the local server
              const parsedUrl = new URL(url);
              if (parsedUrl.origin !== currentEnvironmentBaseUrl.origin) {
                throw new Error('Origin does not match');
              }
              const proxiedRequest = parsedUrl;
              proxiedRequest.protocol = internalHost.protocol;
              proxiedRequest.host = internalHost.host;

              debugInterceptProtocol('Forwarding "%s" request to "%s"', url, proxiedRequest.toString());

              const options: AxiosRequestConfig = {
                ...globalAxiosConfig,
                headers,
                url: proxiedRequest.toString(),
              };
              response = await Request.doLocal(options, accessToken);
            } else {
              // Anything else
              // Only get cookie / data outside the local server, we don't need to support them within
              const cookies = CookieManager.get(url, ses);
              const uploadData = UploadData.getData(request.uploadData, ses);
              const options: AxiosRequestConfig = {
                ...globalAxiosConfig,
                data: await uploadData,
                headers,
                method,
                timeout: (await uploadData) ? TIMEOUT_REQUEST_RESPONSE_UPLOAD : TIMEOUT_REQUEST_RESPONSE,
                url,
              };
              response = await Request.doRemote(options, await cookies);
            }
          } catch (error) {
            if (error.response) {
              response = error.response;
            } else if (error.request) {
              debugInterceptProtocol('Error during the request. Aborting.');
              return callback();
            } else {
              debugInterceptProtocol('Unknown error during the request. Aborting.');
              return callback();
            }
          }

          // Workaround for https://github.com/electron/electron/issues/13228
          // Save the cookie to the session, if any
          const cookies = response.headers['set-cookie'];
          if (cookies !== undefined && cookies.length > 0) {
            debugInterceptProtocol('Incoming cookies detected');
            // Call it within a setImmediate function otherwise it gets stuck for unknown reasons
            setImmediate(async () => {
              try {
                await CookieManager.set(cookies, url, ses);
                debugInterceptProtocol('Successfully set the cookies');
              } catch (error) {
                debugInterceptProtocol('An error happened while setting the cookies:');
                debugInterceptProtocol(error);
              }
            });
          }

          return callback({
            data: response.data,
            headers: response.headers,
            statusCode: response.status,
          });
        },
        error => {
          if (error) {
            debugInterceptProtocol('An error happened while intercepting the protocol');
            return reject(error);
          }
          resolve();
        },
      ),
    ),
  );
};
