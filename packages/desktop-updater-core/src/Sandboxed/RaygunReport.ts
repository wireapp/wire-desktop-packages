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

import {Client as RaygunReporter} from 'raygun';

declare const RaygunToken: string;
declare const RaygunDetails: {name: string; errorCode: number; category: string};
declare const RaygunError: Error;

// tslint:disable-next-line:no-console
const log = console.log;

class RaygunReport {
  public static async send(): Promise<void> {
    try {
      new RaygunReporter()
        .init({
          apiKey: RaygunToken,
        })
        .send(RaygunError, RaygunDetails, response => {
          if (response) {
            log('[VM] Incident reported to Raygun');
          } else {
            log('[VM] Incident failed to be reported');
          }
        });
    } catch (error) {
      log(`[VM] Error: ${error.message}`);
    }
  }
}

export = async (callback: Function) => callback(await RaygunReport.send());
