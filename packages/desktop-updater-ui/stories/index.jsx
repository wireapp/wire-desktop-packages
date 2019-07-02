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
import {addDecorator, storiesOf} from '@storybook/react';
import {boolean, number, select, text, withKnobs} from '@storybook/addon-knobs';
import React from 'react';
import {TranslatedInstaller} from '../src/main/components/InstallerView';
import {TranslatedPrompt} from '../src/main/components/PromptView';
import {TranslatedWrapperOutdated} from '../src/main/components/WrapperOutdatedView';
import {withLocalization} from './decorators/localization';

const GENERIC_ENVELOPE = {
  publicKey: '3942e683bb97a2d84beb6df14bbe25ee5e327a3fc4b05723ff835cd6d6e8d96b',
};
const GENERIC_MANIFEST = {
  author: ['Wire Swiss GmbH'],
  changelog: `### Improved
- Suggestions for mentions get more real estate.
### Fixed
- The cursor in the input bar was off for right-to-left languages.
- If someone used ' or similar special character in their name we displayed the HTML entity instead in system messages. So Papa John's we would show asPapa John#34;s.
- Decreasing the window size could cause the input area to not display correctly.
- The manage services button in the add participants list will open team settings.`,
  expiresOn: '2018-10-31T00:00:00+00:00',
  fileChecksum:
    '37bff3a84c1b4a3cb2db5ef1edefa7a370c68d6a192c28b613fa85c05f13026161d1c8c65c46a3ec5a3b72c336ed0e58a2bd104227ff736fd7544831aa758f87',
  fileChecksumCompressed:
    '37bff3a84c1b4a3cb2db5ef1edefa7a370c68d6a192c28b613fa85c05f13026161d1c8c65c46a3ec5a3b72c336ed0e58a2bd104227ff736fd7544831aa758f87',
  /* eslint-disable no-magic-numbers */
  fileContentLength: 9498238,
  /* eslint-enable no-magic-numbers */
  minimumClientVersion: '2.4.3',
  minimumWebAppVersion: '2018-10-23-12-05-prod',
  releaseDate: '2018-10-17T00:00:00+00:00',
  specVersion: 1,
  targetEnvironment: 'INTERNAL',
  webappVersionNumber: '2018-10-23-12-05-prod',
};

function renderInstaller(data) {
  const PERCENTAGE_MULTIPLY = 100;
  const {progress, installing} = data;

  const percent = number('Percentage (0-100)', progress.percent);

  return (
    <TranslatedInstaller
      installing={boolean('Are we installing?', installing)}
      progress={{
        elapsed: number('Elapsed time (seconds)', progress.elapsed),
        percent: percent === 0 ? undefined : percent / PERCENTAGE_MULTIPLY,
        remaining: number('Remaining time (in seconds)', progress.remaining),
        speed: number('Current downloading speed (in bytes)', progress.speed),
        startedAt: number('Started at (unix timestamp)', progress.startedAt),
        total: number('Total size (in bytes)', progress.total),
        transferred: number('Transferred size (in bytes)', progress.transferred),
      }}
    />
  );
}

function renderPrompt(data) {
  const {changelogUrl, envelope, isWebappBlacklisted, isWebappTamperedWith, manifest} = data;

  return (
    <TranslatedPrompt
      changelogUrl={text('URL of the changelog page?', changelogUrl)}
      envelope={{
        publicKey: envelope.publicKey,
      }}
      isWebappBlacklisted={boolean('Is the webapp version blacklisted?', isWebappBlacklisted)}
      isWebappTamperedWith={boolean('Is the webapp data corrupted?', isWebappTamperedWith)}
      manifest={{
        author: ['Wire Swiss GmbH'],
        changelog: text('Changelog', manifest.changelog),
        expiresOn: text('Expiration of this update', manifest.expiresOn),
        fileChecksum: manifest.fileChecksum,
        fileChecksumCompressed: manifest.fileChecksumCompressed,
        fileContentLength: Long.fromNumber(number('File length (in bytes)', manifest.fileContentLength)),
        minimumClientVersion: manifest.minimumClientVersion,
        minimumWebAppVersion: manifest.minimumWebAppVersion,
        releaseDate: text('Release date of this version', manifest.releaseDate),
        specVersion: 1,
        targetEnvironment: select(
          'Environment targeted',
          {
            DEV: 'DEV',
            EDGE: 'EDGE',
            INTERNAL: 'INTERNAL',
            PRODUCTION: 'PRODUCTION',
            STAGING: 'STAGING',
          },
          manifest.targetEnvironment,
        ),
        webappVersionNumber: text('Web app version', manifest.webappVersionNumber),
      }}
    />
  );
}

function renderWrapperOutdated(data) {
  const {environment} = data;

  return (
    <TranslatedWrapperOutdated
      environment={select(
        'Platform',
        {
          Others: null,
          macOS: 'darwin',
        },
        environment,
      )}
    />
  );
}

addDecorator(withKnobs);
addDecorator(withLocalization);

storiesOf('Installer', module)
  .add('Starting', () =>
    renderInstaller({
      installing: false,
      progress: {
        elapsed: 0,
        percent: null,
        remaining: undefined,
        speed: 0,
        startedAt: 0,
        total: 0,
        transferred: 0,
      },
    }),
  )
  .add('In progress', () =>
    renderInstaller({
      installing: false,
      progress: {
        elapsed: 8,
        percent: 84,
        remaining: 2,
        speed: 736159,
        startedAt: 1518433467150,
        total: 7477716,
        transferred: 6336123,
      },
    }),
  )
  .add('Finished', () =>
    renderInstaller({
      installing: true,
      progress: {
        elapsed: 8,
        percent: null,
        remaining: 2,
        speed: 736159,
        startedAt: 1518433467150,
        total: 7477716,
        transferred: 6336123,
      },
    }),
  );

storiesOf('Prompt', module)
  .add('New update is available', () =>
    renderPrompt({
      changelogUrl: 'https://medium.com/@wireupdates',
      envelope: GENERIC_ENVELOPE,
      isWebappBlacklisted: false,
      isWebappTamperedWith: false,
      manifest: GENERIC_MANIFEST,
    }),
  )
  .add('Webapp version is blacklisted', () =>
    renderPrompt({
      changelogUrl: 'https://medium.com/@wireupdates',
      envelope: GENERIC_ENVELOPE,
      isWebappBlacklisted: true,
      isWebappTamperedWith: false,
      manifest: GENERIC_MANIFEST,
    }),
  )
  .add('Bundle is damaged', () =>
    renderPrompt({
      changelogUrl: 'https://medium.com/@wireupdates',
      envelope: GENERIC_ENVELOPE,
      isWebappBlacklisted: false,
      isWebappTamperedWith: true,
      manifest: GENERIC_MANIFEST,
    }),
  );

storiesOf('WrapperOutdated', module).add('Wrapper version is blacklisted', () =>
  renderWrapperOutdated({environment: 'darwin'}),
);
