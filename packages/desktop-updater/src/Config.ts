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

export namespace Config {
  export class Server {
    public static readonly MAX_RETRY_BEFORE_REJECT: number = 50;

    // ToDo: Add customizable CSP for self-hosted instances of Wire
    public static readonly WEB_SERVER_CSP: string = `connect-src 'self' blob: data: https://wire.com https://www.google.com https://*.giphy.com https://*.unsplash.com https://apis.google.com https://prod-nginz-https.wire.com wss://prod-nginz-ssl.wire.com https://*.wire.com https://api.raygun.io wss://prod-nginz-ssl.wire.com; font-src 'self' data:; frame-src https://*.soundcloud.com https://*.spotify.com https://*.vimeo.com https://*.youtube-nocookie.com https://accounts.google.com; img-src 'self' blob: data: https://*.cloudfront.net https://*.giphy.com https://1-ps.googleusercontent.com https://csi.gstatic.com https://*.wire.com; manifest-src 'self'; media-src 'self' blob: data: *; object-src 'self' https://*.youtube-nocookie.com https://1-ps.googleusercontent.com; prefetch-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.wire.com https://api.raygun.io; style-src 'self' 'unsafe-inline' https://*.googleusercontent.com; worker-src 'self'`;

    // Hardcode public / private keys for the HTTPS web server.
    // Note: This is not used to provide security at all.
    // openssl req -new -newkey rsa:3072 -nodes -out localapp.wire.com.csr -keyout private.key -subj "/businessCategory=Private Organization/serialNumber=CHE-432.881.146/postalCode=6300/C=CH/ST=Zug/L=Zug/O=Wire Swiss GmbH/CN=localapp.wire.com" && openssl x509 -req -sha256 -days 3650 -in localapp.wire.com.csr -signkey private.key -out localapp.wire.com.crt
    public static readonly WEB_SERVER_CIPHERS: string = 'ECDHE-RSA-AES128-GCM-SHA256'; // TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
    public static readonly WEB_SERVER_HOST_CERTIFICATE: string =
      '-----BEGIN CERTIFICATE-----\nMIIEzDCCAzQCCQC6ZUYijyiarzANBgkqhkiG9w0BAQsFADCBpzEdMBsGA1UEDwwU\nUHJpdmF0ZSBPcmdhbml6YXRpb24xGDAWBgNVBAUTD0NIRS00MzIuODgxLjE0NjEN\nMAsGA1UEEQwENjMwMDELMAkGA1UEBhMCQ0gxDDAKBgNVBAgMA1p1ZzEMMAoGA1UE\nBwwDWnVnMRgwFgYDVQQKDA9XaXJlIFN3aXNzIEdtYkgxGjAYBgNVBAMMEWxvY2Fs\nYXBwLndpcmUuY29tMB4XDTE4MDIxNzIxMzIzMVoXDTI4MDIxNTIxMzIzMVowgacx\nHTAbBgNVBA8MFFByaXZhdGUgT3JnYW5pemF0aW9uMRgwFgYDVQQFEw9DSEUtNDMy\nLjg4MS4xNDYxDTALBgNVBBEMBDYzMDAxCzAJBgNVBAYTAkNIMQwwCgYDVQQIDANa\ndWcxDDAKBgNVBAcMA1p1ZzEYMBYGA1UECgwPV2lyZSBTd2lzcyBHbWJIMRowGAYD\nVQQDDBFsb2NhbGFwcC53aXJlLmNvbTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC\nAYoCggGBAJrjx2sTcV6jYK1gtMWLdk5Rcu85jyYQlh7M+hBqTl80mib1Qz/AaaxW\nAlhAWwYwqO4oSTcYcquodDJaLgwkGnHDf9noF8KjXFlThBc5TpYp4nYoChL+nCYj\n4gRvCRHw5aEIyeUDnNkbFUFSv2RfWKe3U4Ney+/JD7c1Jo9zYaAJae/Jb3XAKNHa\nGJ31cw9Zf/YwehVeOk+cQYOOuDqzuZVIk841+LclKPAZ2qZq9HCarF4x9F4Hpvhj\n5y+s3QjPoXYSMsfagN0IBOI9hi0Q37Bx+3vjcckkaXfNbANmPLzUizb9AmX3iWOg\nMJNIe/R88HllpJtx+lJAg6J53KxPjDjRGX4qSB/8ANti73vB4tVpZgQ3BJ4t1EaM\nOzXqsY7T0wx6HldynOsFWCYRM2t7kI3QZe08dpYUTn668PLmkU4/iXnG8frqYbZZ\nggZdtQiZELVH0DkgUIU4+UJbGfwZxAoHao+4dven88P8zeez6qK0a5ZNeOauT2cI\nS1RfneSEvQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBgQBAzDwLILWWi4CaVTzjWSt2\nWCenAcVt86umDE1IoXc86PX8H3EuLVc1M6gcBY+CTdarsSJMld5kuf66kVSq2UAc\n9UAtqOOA4EOB/YAx+9qnp/ZFfIUc2iipp0MLmOETIb3Ug+usg126hze/k8PF5gwD\noRe9i2kMOBkayDjdg32UAzzqFb7dGeXMEvbswx49xuWMohjz4N+pWm9rPTty0CZC\n/Xihloe1IHAeG9Z3GAxbsMClmz7n4heNProgNhUVJap58UIKQ01fKr6kjk4iR+qH\n9USHX38IhCkF6Q9xT+dI9a9q1OVAo5VeTQzJXkrGaINnECZ3cn1jzcCLze+ikGK/\n+0iLSeGTcgR66nG+F7VMKu9ZCPVyeHsSq4C7uhtoGrpPkDnlnlyWGT6yczz31xA+\nrrGj7sm1zTPuQNnLyINbn39gF0daWEWHUu8ZNqm2YQA8UX3Oqgyg+dRWnAUPFPQh\ndk659KihrZL9Pg6B/b5GK17F9bGbBjcA3a+awu4M9cg=\n-----END CERTIFICATE-----\n';
    public static readonly WEB_SERVER_HOST_PRIVATE_KEY: string =
      '-----BEGIN PRIVATE KEY-----\n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\nNSXoZfb1renO918nf/Tz/Q==\n-----END PRIVATE KEY-----\n';
    public static readonly WEB_SERVER_HOST_FINGERPRINT: string = 'sha256/DvEarP99nBcYuFwRAvuNW4HdEgvTkgrrd/eCFFTUKbk=';
    public static readonly WEB_SERVER_SUBJECT_NAME: string = 'localapp.wire.com';

    public static readonly WEB_SERVER_HOST_LOCAL: string = '127.0.0.1';
    public static readonly WEB_SERVER_LISTEN: string = Server.WEB_SERVER_HOST_LOCAL;
    // As per IANA (https://en.wikipedia.org/wiki/Ephemeral_port)
    public static readonly WEB_SERVER_LISTEN_PORT_MAX: number = 65534;
    public static readonly WEB_SERVER_LISTEN_PORT_MIN: number = 49152;
    public static readonly WEB_SERVER_TOKEN_NAME: string = 'Local';
  }
}
