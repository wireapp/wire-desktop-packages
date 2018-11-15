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

import * as crypto from 'crypto';
import * as https from 'https';
const rs = require('jsrsasign');

import {PINS} from './pinningData';

export interface PinningResult {
  certificate?: ElectronCertificate;
  decoding?: boolean;
  errorMessage?: string;
  fingerprintCheck?: boolean;
  verifiedIssuerRootPubkeys?: boolean;
  verifiedPublicKeyInfo?: boolean;
}

interface ElectronCertificate {
  data: string;
  fingerprint: string;
  issuer: ElectronCertificatePrincipal;
  issuerCert: ElectronCertificate;
  issuerName: string;
  serialNumber: string;
  subject: ElectronCertificatePrincipal;
  subjectName: string;
  validExpiry: number;
  validStart: number;
}

interface ElectronCertificatePrincipal {
  commonName: string;
  country: string;
  locality: string;
  organizations: string[];
  organizationUnits: string[];
  state: string;
}

function buildCert(buffer: Buffer): string {
  return `-----BEGIN CERTIFICATE-----\n${buffer.toString('base64')}\n-----END CERTIFICATE-----`;
}

function getDERFormattedCertificate(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const request = https.get(url, () => {
        const certificate = (request.socket as any).getPeerCertificate(true);
        resolve(certificate.raw);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function getFingerprint(derCert: Buffer): string {
  const derBinary = derCert.toString('binary');
  const hexDerFileContents = rs.rstrtohex(derBinary);
  const pemString = rs.KJUR.asn1.ASN1Util.getPEMStringFromHex(hexDerFileContents, 'CERTIFICATE');
  const publicKey = rs.X509.getPublicKeyInfoPropOfCertPEM(pemString);
  const publicKeyBytes = Buffer.from(publicKey.keyhex, 'hex').toString('binary');
  return crypto
    .createHash('sha256')
    .update(publicKeyBytes)
    .digest('base64');
}

function hostnameShouldBePinned(hostname: string): boolean {
  return PINS.some(pin => pin.url.test(hostname.toLowerCase().trim()));
}

function verifyPinning(hostname: string, certificate: ElectronCertificate): PinningResult {
  const {
    data: certData,
    issuerCert: {data: issuerCertData},
  } = certificate;

  let issuerCertHex;
  let publicKey;
  let publicKeyBytes;
  let publicKeyFingerprint;

  const errorMessages: string[] = [];

  try {
    issuerCertHex = rs.pemtohex(issuerCertData);
    publicKey = rs.X509.getPublicKeyInfoPropOfCertPEM(certData);
    publicKeyBytes = Buffer.from(publicKey.keyhex, 'hex').toString('binary');
    publicKeyFingerprint = crypto
      .createHash('sha256')
      .update(publicKeyBytes)
      .digest('base64');
  } catch (error) {
    return {
      decoding: false,
      errorMessage: error,
    };
  }

  const result: PinningResult = {};

  for (const pin of PINS) {
    const {url, publicKeyInfo = [], issuerRootPubkeys = []} = pin;

    if (url.test(hostname.toLowerCase().trim())) {
      if (issuerRootPubkeys.length > 0) {
        result.verifiedIssuerRootPubkeys = issuerRootPubkeys.some(pubkey =>
          rs.X509.verifySignature(issuerCertHex, rs.KEYUTIL.getKey(pubkey))
        );
        if (!result.verifiedIssuerRootPubkeys) {
          const pubkeysCombined = issuerRootPubkeys.join(', ');
          const errorMessage = `Issuer root public key signatures: none of "${pubkeysCombined}" could be verified.`;
          errorMessages.push(errorMessage);
        }
      }

      result.verifiedPublicKeyInfo = publicKeyInfo
        .reduce((arr: boolean[], pubkey) => {
          const {
            algorithmID: knownAlgorithmID,
            algorithmParam: knownAlgorithmParam,
            fingerprints: knownFingerprints,
          } = pubkey;

          const fingerprintCheck =
            knownFingerprints.length > 0 &&
            knownFingerprints.some(knownFingerprint => knownFingerprint === publicKeyFingerprint);
          const algorithmIDCheck = knownAlgorithmID === publicKey.algoid;
          const algorithmParamCheck = knownAlgorithmParam === publicKey.algparam;

          if (!fingerprintCheck) {
            const fingerprintsCombined = knownFingerprints.join(', ');
            const errorMessage = `Public key fingerprints: "${publicKeyFingerprint}" could not be verified with any of the known fingerprints "${fingerprintsCombined}".`;
            errorMessages.push(errorMessage);
          }

          if (!algorithmIDCheck) {
            const algorithmID = publicKey.algoid;
            const errorMessage = `Algorithm ID: "${algorithmID}" could not be verified with the known ID "${knownAlgorithmID}".`;
            errorMessages.push(errorMessage);
          }

          if (!algorithmParamCheck) {
            const algorithmParam = publicKey.algparam;
            const errorMessage = `Algorithm parameter: "${algorithmParam}" could not be verified with the known parameter "${knownAlgorithmParam}".`;
            errorMessages.push(errorMessage);
          }

          arr.push(fingerprintCheck, algorithmIDCheck, algorithmParamCheck);

          return arr;
        }, [])
        .every(value => Boolean(value));

      break;
    }
  }

  if (errorMessages.length > 0) {
    result.errorMessage = errorMessages.join('\n');
    result.certificate = certificate;
  }

  return result;
}

export {buildCert, getDERFormattedCertificate, getFingerprint, hostnameShouldBePinned, verifyPinning};
