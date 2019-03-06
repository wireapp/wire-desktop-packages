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

import * as minimist from 'minimist';
const argv = minimist(process.argv.slice(1));

export class Environment {
  public static readonly bypassSecureUpdater: boolean = typeof argv.bypassSecureUpdater !== 'undefined';
  public static readonly forcedEnvironment?: string =
    typeof argv.env === 'string' ? <string>argv.env.toUpperCase() : undefined;
  public static readonly isDevelopment: boolean = false;
  public static currentEnvironment: string = 'PRODUCTION';

  public static async get(): Promise<string> {
    // Attempt to use the default environment, if none, fallback to production
    return this.currentEnvironment;
  }
  public static async set(environment: string): Promise<void> {
    this.currentEnvironment = environment;
  }

  public static convertUrlToHostname(url: string): string {
    const {protocol, hostname} = new URL(url);
    return `${protocol}//${hostname}`;
  }
}
