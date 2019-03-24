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

import {crypto_generichash_BYTES_MAX} from 'libsodium-wrappers';
import * as path from 'path';

export class Config {}

export namespace Config {
  export class Updater {
    public static readonly SPEC_VERSION: number = 1;

    public static readonly BROADCAST_RENDERER_TIMEOUT: number = 3000; // 3 seconds
    public static readonly CONNECTIVITY_INTERNAL: number = 2000; // 2 seconds
    public static readonly PERIODIC_INTERVAL: number = 60000; // 1 minute

    public static readonly CHANGELOG_URL: string = 'https://medium.com/wire-news/desktop-updates/home';

    // Used version when none is found (must be old enough so it trigger the blacklist)
    public static readonly FALLBACK_WEB_VERSION = '2017-05-15-09-00-prod';

    // Storage informations
    public static readonly LOCAL_BUNDLE_FOLDER_NAME: string = '.bundle/';
    public static readonly DEFAULT_FILE_EXTENSION: string = 'asar';
    public static readonly UPDATER_DATA_FOLDER_NAME: string = 'WireResources';
    public static readonly MANIFEST_FILE: string = 'manifest.dat';
    public static readonly SETTINGS_FILE: string = 'settings.json';

    public static readonly FILENAME_CHECKSUM_LENGTH: number = 32;
  }

  export class Prompt {
    public static readonly IPC_DECISION_NAME: string = 'decision';
  }

  export class Installer {}

  export class Verifier {
    public static readonly BLAKE2B_HASH_BYTES: number = crypto_generichash_BYTES_MAX;
    public static readonly MAX_EXPIRES_TIME: number = 1814400000; // Maximal distance in time between release and expiration time in ms (3 weeks)
  }

  export class Downloader {
    public static readonly TIMEOUT: number = 300000; // 5 minutes timeout max.
    public static readonly MAX_CONTENT_LENGTH: number = 100000000; // 100 Mb max.
    public static readonly USER_AGENT: string = 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0';
    public static readonly CIPHERS: string = 'ECDHE-RSA-AES128-GCM-SHA256'; // // TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
    public static readonly PINNING_CERTIFICATE: string =
      '-----BEGIN CERTIFICATE-----\nMIIGLDCCBRSgAwIBAgIQBFr46CI0aVAbnpwcbQOOVTANBgkqhkiG9w0BAQsFADBk\nMQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3\nd3cuZGlnaWNlcnQuY29tMSMwIQYDVQQDExpEaWdpQ2VydCBCYWx0aW1vcmUgQ0Et\nMiBHMjAeFw0xNzA5MTkwMDAwMDBaFw0xODA5MjYxMjAwMDBaMHgxCzAJBgNVBAYT\nAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdTZWF0dGxlMRgwFgYD\nVQQKEw9BbWF6b24uY29tIEluYy4xKDAmBgNVBAMMHyouczMuZXUtY2VudHJhbC0x\nLmFtYXpvbmF3cy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCu\n58P7iKoJmc4+pUPWwFXWt8YhkhKc7fqWmfG+WkV1Hyjd5LIWvHMHus8KahEaRNTM\nJ6D3A0Aov5hDWTy7Hm2S1gPWFmiAPVLuV03qgcTm0amd386uYFyGwfLH3nO0GakH\nMvcOh8TaeibeNqz7lL/q3v6U3dpVYmL+B4B3YEQpXvw5+0K8AnZNKMxYu5I03lNc\nEMp9oyNgMg/vajOwWNl1tek+KBxMhNIUVz6theJUQxTaMV6mxkw8Owd/m62JSevQ\nYPX0qHQ3r2a6sLwC9yM6k41Tqkbz1HH4lqmWBe8/4oKqU3w/WPJawlPJrhPzm7lU\nH5Sgo53lr5Pu1Zh/i/rlAgMBAAGjggLEMIICwDAfBgNVHSMEGDAWgBTAErIodGhG\nZ+lwJXQaAEVbBn1cRDAdBgNVHQ4EFgQU7m46ke9HT3jq38ElmSkYXKWm5yswgfMG\nA1UdEQSB6zCB6IIfKi5zMy5ldS1jZW50cmFsLTEuYW1hem9uYXdzLmNvbYIfKi5z\nMy1ldS1jZW50cmFsLTEuYW1hem9uYXdzLmNvbYIdczMtZXUtY2VudHJhbC0xLmFt\nYXpvbmF3cy5jb22CHXMzLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tgidzMy5k\ndWFsc3RhY2suZXUtY2VudHJhbC0xLmFtYXpvbmF3cy5jb22CKSouczMuZHVhbHN0\nYWNrLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tghIqLnMzLmFtYXpvbmF3cy5j\nb20wDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcD\nAjCBgQYDVR0fBHoweDA6oDigNoY0aHR0cDovL2NybDMuZGlnaWNlcnQuY29tL0Rp\nZ2lDZXJ0QmFsdGltb3JlQ0EtMkcyLmNybDA6oDigNoY0aHR0cDovL2NybDQuZGln\naWNlcnQuY29tL0RpZ2lDZXJ0QmFsdGltb3JlQ0EtMkcyLmNybDBMBgNVHSAERTBD\nMDcGCWCGSAGG/WwBATAqMCgGCCsGAQUFBwIBFhxodHRwczovL3d3dy5kaWdpY2Vy\ndC5jb20vQ1BTMAgGBmeBDAECAjB5BggrBgEFBQcBAQRtMGswJAYIKwYBBQUHMAGG\nGGh0dHA6Ly9vY3NwLmRpZ2ljZXJ0LmNvbTBDBggrBgEFBQcwAoY3aHR0cDovL2Nh\nY2VydHMuZGlnaWNlcnQuY29tL0RpZ2lDZXJ0QmFsdGltb3JlQ0EtMkcyLmNydDAM\nBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4IBAQBDROe1EFLMaUQfDzXl4loO\nG4/d8qt6inSfiDTo//tWO2j5+q8wJkJEtg9+E0rXmT1NCY1zgY3Pr1WTtdTNwZFS\nXvXqsH6doePQ0a/pb4Slojgy3+oYHN+wq/hECcgZHWMBSmeBeoPC2BY+DV8lJEBd\nJECjhx+AXFdcd4HEq7ha+NokKFySHBDrEHmXQXwWPQLUFcc3nscGemsxPiYvornk\nU5ZfT1k7IlYv+iojUTrgbeX7KI293AF+8t8MadUjgoyZ45+2xzMT+1+SrNkaFaQg\nTV0v6Qv64/A3M95Ts5FZvVqB3J72d6XoKsyiQ7rz39zU9z4zAkMQRk2npZxNDLr4\n-----END CERTIFICATE-----\n';
    public static readonly UPDATE_SPEC = path.join(
      __dirname,
      '../../node_modules/@wireapp/desktop-updater-spec/update.proto'
    );
  }

  export class ErrorDispatcher {
    public static readonly LINK_BUGREPORT: string =
      'https://support.wire.com/hc/en-us/requests/new?ticket_form_id=101615';

    public static readonly RAYGUN_ENABLED: boolean = true;
    public static readonly RAYGUN_TOKEN: string = 'LI4MmJ+1iCwrX9DnjYYhYg==';
  }

  export class EnvelopeGenerator {
    public static readonly FILENAME_CHECKSUM_LENGTH: number = 16;
  }

  export class WrapperOutdated {
    public static readonly WRAPPER_UPDATE_LINK_MACOS: string = 'macappstores://showUpdatesPage';
    public static readonly WRAPPER_UPDATE_LINK_OTHERS: string = 'https://wire.com/download/';
  }
}
