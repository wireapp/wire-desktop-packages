/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import * as Long from 'long';

export interface ServerWebConfigInterface {
  ANALYTICS_API_KEY: string;
  APP_NAME: string;
  BACKEND_REST: string;
  BACKEND_WS: string;
  FEATURE: {
    CHECK_CONSENT: boolean;
    ENABLE_ACCOUNT_REGISTRATION: boolean;
    ENABLE_DEBUG: boolean;
    ENABLE_PHONE_LOGIN: boolean;
    ENABLE_SSO: boolean;
    SHOW_LOADING_INFORMATION: boolean;
  };
  RAYGUN_API_KEY: string;
  URL: {
    ACCOUNT_BASE: string;
    MOBILE_BASE: string;
    PRIVACY_POLICY: string;
    SUPPORT_BASE: string;
    TEAMS_BASE: string;
    TERMS_OF_USE_PERSONAL: string;
    TERMS_OF_USE_TEAMS: string;
    WEBSITE_BASE: string;
  };
  APP_BASE?: string;
  ENVIRONMENT?: string;
  VERSION?: string;
}

export enum BridgeIPC {
  UPDATE_AVAILABLE = 'BridgeIPC.UPDATE_AVAILABLE',
  UPDATE_INSTALLED = 'BridgeIPC.UPDATE_INSTALLED',
  UPDATE_START_INSTALL = 'BridgeIPC.UPDATE_START_INSTALL',
  UPDATE_END_INSTALL = 'BridgeIPC.UPDATE_END_INSTALL',
  UPDATE_AVAILABLE_ACK = 'BridgeIPC.UPDATE_AVAILABLE_ACK',
  UPDATE_AVAILABLE_DISPLAY = 'BridgeIPC.UPDATE_AVAILABLE_DISPLAY',
}

export interface ProgressInterface {
  elapsed: number;
  percent: number;
  remaining: number;
  speed: number; // in bytes
  startedAt: number;
  total?: number;
  transferred: number;
}

export interface Envelope {
  data: Buffer;
  publicKey: Buffer;
  raw: Buffer;
  signature: Buffer;
}

export interface Manifest {
  /**
   * Author of the update.
   */
  author: string[];

  /**
   * Changelog data with Markdown markup.
   */
  changelog: string;

  /**
   * Date when the file is considered as expired (cannot be validated anymore).
   *
   * The manifest can be re-signed with a new expiration date (e.g. if no version
   * is released in the meantime).
   *
   * If the latest available version has an expired `expiresOn` field the
   * client should be warned of that (could be indefinite freeze attacks).
   *
   * `expiresOn` shall not stay for more than a defined number of weeks, otherwise the same
   * version must be resigned again to extend its validity.
   *
   * Should be an ISO-8601 string in the signed JSON that will be converted to
   * a `Date` object afterwards.
   */
  expiresOn: string;

  /**
   * Checksum (BLAKE2b) of the file being downloaded.
   */
  fileChecksum: Buffer;
  fileChecksumCompressed: Buffer;

  /**
   * Size of the file in bytes.
   * Clients should not download more than this size and verify that the file exactly matches this size.
   */
  fileContentLength: Long;

  /**
   * Blacklisted wrapper versions (anything below cannot longer be used)
   */
  minimumClientVersion: string;

  /**
   * Blacklisted web app versions (anything below cannot longer be used)
   */
  minimumWebAppVersion: string;

  /**
   * Date on which the release has been created.
   *
   * Should be an ISO-8601 string in the signed JSON that will be converted to
   * a `Date` object afterwards.
   */
  releaseDate: string;

  /**
   * Manifest version.
   */
  specVersion: number;

  /**
   * Targeted wrapper development environment ("INTERNAL", "PRODUCTION", "STAGING", "LOCALHOST", ...).
   */
  targetEnvironment: string;

  /**
   * Version number of the web app. Will be matched against current version to prevent rollback attacks.
   */
  webappVersionNumber: string;
}

export interface Decision {
  /**
   * True, if user selected to do the update.
   */
  allow: boolean;

  /**
   * True, if user enabled automatic updates.
   */
  installAutomatically: boolean;
}
