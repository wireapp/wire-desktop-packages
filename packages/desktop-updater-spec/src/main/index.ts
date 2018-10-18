import * as Long from 'long';

export interface Metadata {
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
   * The metadata can be re-signed with a new expiration date (e.g. if no version
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
   * Metadata version.
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
