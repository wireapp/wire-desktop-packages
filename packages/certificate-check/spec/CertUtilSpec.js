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

const fs = require('fs');
const path = require('path');

const {buildCert, getFingerprint, hostnameShouldBePinned, verifyPinning} = require('../src/main');
const {WILDCARD_CERT_FINGERPRINT} = require('../src/static');

describe('hostnameShouldBePinned', () => {
  it('pins app.wire.com', () => {
    const result = hostnameShouldBePinned('app.wire.com');
    expect(result).toBe(true);
  });

  it(`doesn't pin localhost`, () => {
    const result = hostnameShouldBePinned('localhost');
    expect(result).toBe(false);
  });
});

describe('getFingerprint', () => {
  it('validates the fingerprint for wire.com', () => {
    const certificatePath = path.join(__dirname, 'helpers', 'wire.com-wildcard.der');
    const file = fs.readFileSync(certificatePath);
    const fingerprint = getFingerprint(file);

    expect(fingerprint).toBe(WILDCARD_CERT_FINGERPRINT);
  });
});

describe('verifyPinning', () => {
  it('verifies the certificate for wire.com', () => {
    const certificatePath = path.join(__dirname, 'helpers', 'wire.com-wildcard.der');
    const issuerCertPath = path.join(__dirname, 'helpers', 'wire.com-issuer.der');

    const certFile = fs.readFileSync(certificatePath);
    const issuerCertFile = fs.readFileSync(issuerCertPath);

    const certData = {
      data: buildCert(certFile),
      issuerCert: {
        data: buildCert(issuerCertFile),
      },
    };

    const pinningResult = verifyPinning('wire.com', certData);

    expect(pinningResult.verifiedPublicKeyInfo).toBe(true);
  });
});
