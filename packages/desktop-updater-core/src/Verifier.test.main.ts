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
import Long from 'long';
import {ConfigUpdater} from './Config';
import {Updater} from './Updater';
import {Utils} from './Utils';
import {Verifier} from './Verifier';

class WebappVersion {
  private static readonly helper = (caller: string, howMuchTime: number, currentVersion: string) =>
    Utils.formatWebappVersion({buildDate: Utils.parseWebappVersion(currentVersion).buildDate[caller](howMuchTime)});

  public static plus(howMuchTime: number, currentVersion: string): string {
    return WebappVersion.helper('plus', howMuchTime, currentVersion);
  }
  public static minus(howMuchTime: number, currentVersion: string): string {
    return WebappVersion.helper('minus', howMuchTime, currentVersion);
  }
}

interface ErrorInterface {
  message: string;
  name: string;
}

const currentWebappEnv = 'PRODUCTION';

describe('Verifier', () => {
  describe('ensurePublicKeyIsTrusted', () => {
    const publicKeyBuffer = Buffer.from('ffbab1f0d42ef879c589dd2b85437875b63b9f706ffaa8926fccfb5b8e9abc53', 'hex');
    const anotherPublicKeyBuffer = Buffer.from(
      '3942e683bb97a2d84beb6df14bbe25ee5e327a3fc4b05723ff835cd6d6e8d96b',
      'hex'
    );
    const trustStore = [publicKeyBuffer.toString('hex')];

    // Helper
    const ensurePublicKeyIsTrusted = (
      toVerifyPublicKey: Buffer = publicKeyBuffer,
      toVerifyTrustStore: string[] = trustStore,
      error: ErrorInterface,
      env?: string
    ): Promise<void> =>
      assert.rejects(Verifier.ensurePublicKeyIsTrusted(toVerifyPublicKey, toVerifyTrustStore, env), error);

    it('works in normal conditions', async () => Verifier.ensurePublicKeyIsTrusted(publicKeyBuffer, trustStore));

    it('fails when the provided public key is not a Buffer', () =>
      ensurePublicKeyIsTrusted(
        <any>'test',
        trustStore,
        {
          message: 'Public key provided is not a buffer.',
          name: 'IntegrityError',
        },
        currentWebappEnv
      ));

    it('fails when the provided trust store is not an Array', () =>
      ensurePublicKeyIsTrusted(
        publicKeyBuffer,
        <any>'oops',
        {
          message: 'Trust store does not exist for the environment "PRODUCTION" (or is not an array).',
          name: 'IntegrityError',
        },
        currentWebappEnv
      ));

    it('fails when the provided trust store is empty', () =>
      ensurePublicKeyIsTrusted(
        anotherPublicKeyBuffer,
        [],
        {
          message: 'No keys are present in the trust store for the environment "PRODUCTION".',
          name: 'IntegrityError',
        },
        currentWebappEnv
      ));

    it('fails when the provided pulic key is not present in the trust store', () =>
      ensurePublicKeyIsTrusted(
        anotherPublicKeyBuffer,
        trustStore,
        {
          message:
            'Public key is not in the trust store for environment "PRODUCTION". Public key: 3942e683bb97a2d84beb6df14bbe25ee5e327a3fc4b05723ff835cd6d6e8d96b',
          name: 'IntegrityError',
        },
        currentWebappEnv
      ));
  });

  describe('verifyEnvelopeIntegrity', () => {});

  describe('verifyFileIntegrity', () => {
    //it('can verify the integrity of a file', async () => {
    //});
  });

  describe('verifyManifest', () => {
    const fileContentLength = Long.fromNumber(123456);
    const fileChecksum = Buffer.from('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    const fileChecksumCompressed = Buffer.from('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');

    const currentWebappVersionNumber = '2019-06-06-12-31';
    const minimumWebAppVersion = '2019-01-05-13-49';
    const currentWrapperVersion = '3.9';

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const TEN_DAYS = 10 * ONE_DAY;
    const ONE_YEAR = 365 * ONE_DAY;

    const currentDate = Date.now();
    const releaseDate = new Date(currentDate).toISOString();
    const expiresOn = new Date(currentDate + TEN_DAYS).toISOString();

    const legitManifest = {
      author: ['Wire Swiss GmbH'],
      changelog: 'This update includes bug fixes and improvements.',
      expiresOn,
      fileChecksum,
      fileChecksumCompressed,
      fileContentLength,
      minimumClientVersion: currentWrapperVersion,
      minimumWebAppVersion,
      releaseDate,
      specVersion: 1,
      targetEnvironment: currentWebappEnv,
      webappVersionNumber: currentWebappVersionNumber,
    };

    // Helper
    const verifyManifest = (
      manifest: Partial<Updater.Manifest>,
      error: ErrorInterface,
      toVerifyCurrentWebappVersionNumber = currentWebappVersionNumber,
      toVerifyCurrentWebappEnv = currentWebappEnv,
      toVerifyCurrentWrapperVersion = currentWrapperVersion
    ): Promise<void> =>
      assert.rejects(
        Verifier.verifyManifest(
          {...legitManifest, ...manifest},
          toVerifyCurrentWebappVersionNumber,
          toVerifyCurrentWebappEnv,
          toVerifyCurrentWrapperVersion
        ),
        error
      );

    it('can verify a legit manifest', async () => {
      await Verifier.verifyManifest(legitManifest, currentWebappVersionNumber, currentWebappEnv, currentWrapperVersion);
    });

    it('fails when the spec version does not equal the current one', async () => {
      await verifyManifest(
        {specVersion: 546586},
        {
          message: 'Current specs number is not supported',
          name: 'VerifyError',
        }
      );
    });

    it('fails when there is a target environment mismatch', async () => {
      await verifyManifest(
        {targetEnvironment: 'DEVELOPMENT'},
        {
          message: 'Local environment mismatch the remote one',
          name: 'VerifyMismatchEnvironment',
        }
      );
    });

    it('fails when the expiry date is before the current time', async () => {
      const expiresOn = new Date(currentDate - TEN_DAYS).toISOString();
      await verifyManifest(
        {expiresOn},
        {
          message: 'This update expired and is no longer valid',
          name: 'VerifyExpirationError',
        }
      );
    });

    it('fails when the expiry date is too far in the future', async () => {
      const expiresOn = new Date(currentDate + ONE_YEAR).toISOString();
      await verifyManifest(
        {expiresOn},
        {
          message: 'This update exceed the enforced validity limitation',
          name: 'VerifyError',
        }
      );
    });

    it('fails when ISO 8601 dates are not valid', async () => {
      const expectedError = {
        message: 'Expected ISO 8601 dates are not valid',
        name: 'VerifyError',
      };
      await verifyManifest({expiresOn: 'invalid_iso_date'}, expectedError);
      await verifyManifest({releaseDate: 'invalid_iso_date'}, expectedError);
    });

    it('fails when the update release date is in the future', async () => {
      const releaseDate = new Date(currentDate + ONE_YEAR).toISOString();
      await verifyManifest(
        {releaseDate},
        {
          message: 'This update has not been yet released',
          name: 'VerifyError',
        }
      );
    });

    const invalidVersionString = '2.54;alsg';

    it('fails when the minimum client version is invalid', async () => {
      await verifyManifest(
        {minimumClientVersion: invalidVersionString},
        {
          message: `Client versions are not valid. Minimum client version is ${invalidVersionString} and current wrapper version is ${currentWrapperVersion}`,
          name: 'VerifyError',
        }
      );
    });

    it('fails when given web app versions are invalid', async () => {
      const expectedError = {
        message: 'Webapp versions are not valid',
        name: 'VerifyError',
      };
      await verifyManifest({minimumWebAppVersion: invalidVersionString}, expectedError);
      await verifyManifest({webappVersionNumber: invalidVersionString}, expectedError);
      await verifyManifest({}, expectedError, invalidVersionString);
    });

    it('fails when the webapp version is older than the fallback version', async () => {
      await verifyManifest(
        {webappVersionNumber: WebappVersion.minus(ONE_YEAR, ConfigUpdater.FALLBACK_WEB_VERSION)},
        {
          message: 'This webapp version is too old to be used',
          name: 'VerifyError',
        }
      );
    });

    it('fails when the length of the file is non readable', async () => {
      await verifyManifest(<any>{fileContentLength: 545644848}, {
        message: 'File content length is not a Long value',
        name: 'VerifyError',
      });
    });

    it('fails when the changelog is not a string', async () => {
      await verifyManifest(<any>{changelog: {b: 'd', a: 'c'}}, {
        message: 'Changelog is not a string',
        name: 'VerifyError',
      });
    });

    it('fails when the checksum cannot be converted to a hex value', async () => {
      const expectedError = {
        message: 'Could not convert the checksum to a hexdecimal value',
        name: 'VerifyError',
      };
      await verifyManifest({fileChecksum: Buffer.from('aaaaaaaa0000')}, expectedError);
      await verifyManifest(<any>{fileChecksum: 'aaaaaaaaaaa'}, expectedError);
      await verifyManifest(<any>{fileChecksum: [1, 2, 3]}, expectedError);
    });

    it('fails when the compressed checksum cannot be converted to a hex value', async () => {
      const expectedError = {
        message: 'Could not convert the checksum (compressed) to a hexdecimal value',
        name: 'VerifyError',
      };
      await verifyManifest({fileChecksumCompressed: Buffer.from('aaaaaaaa0000')}, expectedError);
      await verifyManifest(<any>{fileChecksumCompressed: 'aaaaaaaaaaa'}, expectedError);
      await verifyManifest(<any>{fileChecksumCompressed: [1, 2, 3]}, expectedError);
    });

    it('fails when the webapp version is older than the fallback version', async () => {
      const webappVersionNumber = WebappVersion.minus(TEN_DAYS, legitManifest.webappVersionNumber);
      await verifyManifest(
        {webappVersionNumber},
        {
          message: 'The given update is older than ours',
          name: 'VerifyError',
        }
      );
    });

    it('fails when the web app version have a minimum requirement that is too old to be used', async () => {
      const minimumWebAppVersion = WebappVersion.minus(ONE_YEAR, ConfigUpdater.FALLBACK_WEB_VERSION);
      await verifyManifest(
        {minimumWebAppVersion},
        {
          message: 'This webapp version have a minimum requirement that is too old to be used',
          name: 'VerifyError',
        }
      );
    });

    it('fails when the minimum version required cannot be satisfacted as latest version is lower', async () => {
      const minimumWebAppVersion = WebappVersion.plus(TEN_DAYS, currentWebappVersionNumber);
      await verifyManifest(
        {minimumWebAppVersion},
        {
          message: 'Minimum version required cannot be satisfacted as latest version is lower',
          name: 'VerifyError',
        }
      );
    });

    it('fails when no author(s) were present in the manifest', async () => {
      const expectedError = {
        message: 'No author has been specified for this update',
        name: 'VerifyError',
      };
      await verifyManifest({author: []}, expectedError);
      await verifyManifest(<any>{author: 'string'}, expectedError);
    });

    it('fails when the web app version is blacklisted', async () => {
      const expectedError = {
        message: Verifier.OUTDATED.WEBAPP,
        name: 'BlacklistedVersionError',
      };
      await verifyManifest({}, expectedError, WebappVersion.minus(TEN_DAYS, legitManifest.minimumWebAppVersion));
    });

    it('fails when the wrapper version is blacklisted', async () => {
      const expectedError = {
        message: Verifier.OUTDATED.WRAPPER,
        name: 'BlacklistedVersionError',
      };
      await verifyManifest({}, expectedError, currentWebappVersionNumber, currentWebappEnv, '3.0');
    });

    it('fails when the environment mismatch', async () => {
      await verifyManifest(
        {},
        {
          message: 'This webapp bundle is not intended for this environment',
          name: 'VerifyMismatchEnvironment',
        },
        currentWebappVersionNumber,
        'DEVELOPMENT'
      );
    });
  });
});
