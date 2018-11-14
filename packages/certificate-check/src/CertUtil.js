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

const crypto = require('crypto');
const https = require('https');
const rs = require('jsrsasign');

const {PINS} = require('./pinningData');

module.exports = {
  buildCert: buffer => {
    return `-----BEGIN CERTIFICATE-----\n${buffer.toString('base64')}\n-----END CERTIFICATE-----`;
  },
  getDERFormattedCertificate: url => {
    return new Promise((resolve, reject) => {
      try {
        const request = https.get(url, () => {
          const certificate = request.socket.getPeerCertificate(true);
          resolve(certificate.raw);
        });
      } catch (error) {
        reject(error);
      }
    });
  },
  getFingerprint: derCert => {
    const derBinary = derCert.toString('binary');
    const hexDerFileContents = rs.rstrtohex(derBinary);
    const pemString = rs.KJUR.asn1.ASN1Util.getPEMStringFromHex(hexDerFileContents, 'CERTIFICATE');
    const publicKey = rs.X509.getPublicKeyInfoPropOfCertPEM(pemString);
    const publicKeyBytes = Buffer.from(publicKey.keyhex, 'hex').toString('binary');
    return crypto
      .createHash('sha256')
      .update(publicKeyBytes)
      .digest('base64');
  },
  hostnameShouldBePinned: hostname => {
    return PINS.some(pin => pin.url.test(hostname.toLowerCase().trim()));
  },
  verifyPinning(hostname, certificate) {
    const {
      data: certData,
      issuerCert: {data: issuerCertData},
    } = certificate;

    let issuerCertHex;
    let publicKey;
    let publicKeyBytes;
    let publicKeyFingerprint;

    try {
      issuerCertHex = rs.pemtohex(issuerCertData);
      publicKey = rs.X509.getPublicKeyInfoPropOfCertPEM(certData);
      publicKeyBytes = Buffer.from(publicKey.keyhex, 'hex').toString('binary');
      publicKeyFingerprint = crypto
        .createHash('sha256')
        .update(publicKeyBytes)
        .digest('base64');
    } catch (error) {
      console.error('verifyPinning', error);
      return {decoding: false};
    }

    const result = {};

    const errorMessages = [];

    for (const pin of PINS) {
      const {url, publicKeyInfo = [], issuerRootPubkeys = []} = pin;

      if (url.test(hostname.toLowerCase().trim())) {
        if (issuerRootPubkeys.length > 0) {
          result.verifiedIssuerRootPubkeys = issuerRootPubkeys.some(pubkey =>
            rs.X509.verifySignature(issuerCertHex, rs.KEYUTIL.getKey(pubkey))
          );
          if (!result.verifiedIssuerRootPubkeys) {
            errorMessages.push(
              `Issuer root public key signatures: none of "${issuerRootPubkeys.join(', ')}" could be verified.`
            );
          }
        }

        result.verifiedPublicKeyInfo = publicKeyInfo
          .reduce((arr, pubkey) => {
            const {
              fingerprints: knownFingerprints = [],
              algorithmID: knownAlgorithmID = '',
              algorithmParam: knownAlgorithmParam = null,
            } = pubkey;

            const fingerprintCheck =
              knownFingerprints.length > 0
                ? knownFingerprints.some(knownFingerprint => knownFingerprint === publicKeyFingerprint)
                : undefined;
            const algorithmIDCheck = knownAlgorithmID === publicKey.algoid;
            const algorithmParamCheck = knownAlgorithmParam === publicKey.algparam;

            if (!fingerprintCheck) {
              errorMessages.push(
                `Public key fingerprints: "${publicKeyFingerprint}" could not be verified with any of the known fingerprints "${knownFingerprints.join(
                  ', '
                )}".`
              );
            }

            if (!algorithmIDCheck) {
              errorMessages.push(
                `Algorithm ID: "${publicKey.algoid}" could not be verified with the known ID "${knownAlgorithmID}".`
              );
            }

            if (!algorithmParamCheck) {
              errorMessages.push(
                `Algorithm parameter: "${
                  publicKey.algparam
                }" could not be verified with the known parameter "${knownAlgorithmParam}".`
              );
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
  },
};
