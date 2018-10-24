import * as Long from 'long';
import {addDecorator, storiesOf} from '@storybook/react';
import {boolean, number, select, text, withKnobs} from '@storybook/addon-knobs';
import {OS_FAMILY, WrapperOutdated} from '../src/main/components/WrapperOutdated';
import {Installer} from '../src/main/components/Installer';
import {Prompt} from '../src/main/components/Prompt';
import React from 'react';

addDecorator(withKnobs);

function renderInstaller(data) {
  const PERCENTAGE_MULTIPLY = 100;
  const {progress, installing} = data;

  return (
    <Installer
      installing={boolean('Are we installing?', installing)}
      progress={{
        elapsed: number('Elapsed time (seconds)', progress.elapsed),
        percent:
          number('Percentage (0-100)', progress.percent * PERCENTAGE_MULTIPLY) === 0
            ? undefined
            : progress.percent / PERCENTAGE_MULTIPLY,
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
  const {metadata, changelogUrl, isWebappBlacklisted, isWebappTamperedWith} = data;

  return (
    <Prompt
      metadata={{
        author: ['Wire Swiss GmbH'],
        changelog: text('Changelog', metadata.changelog),
        expiresOn: text('Expiration of this update', metadata.expiresOn),
        fileChecksum: metadata.fileChecksum,
        fileChecksumCompressed: metadata.fileChecksumCompressed,
        fileContentLength: Long.fromNumber(number('File length (in bytes)', metadata.fileContentLength)),
        minimumClientVersion: metadata.minimumClientVersion,
        minimumWebAppVersion: metadata.minimumWebAppVersion,
        releaseDate: text('Release date of this version', metadata.releaseDate),
        specVersion: 1,
        targetEnvironment: text('Environment targeted', metadata.targetEnvironment),
        webappVersionNumber: text('Web app version', metadata.webappVersionNumber),
      }}
      changelogUrl={text('URL of the changelog page?', changelogUrl)}
      isWebappBlacklisted={boolean('Is the webapp version blacklisted?', isWebappBlacklisted)}
      isWebappTamperedWith={boolean('Is the webapp data corrupted?', isWebappTamperedWith)}
    />
  );
}

function renderWrapperOutdated(data) {
  const {environment} = data;

  return (
    <WrapperOutdated
      environment={select(
        'Platform',
        {
          Others: null,
          macOS: OS_FAMILY.DARWIN,
        },
        environment
      )}
    />
  );
}

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
    })
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
    })
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
    })
  );

const GENERIC_METADATA = {
  author: ['Wire Swiss GmbH'],
  changelog: `### Improved
- Suggestions for mentions get more real estate.
### Fixed
- The cursor in the input bar was off for right-to-left languages.
- If someone used ' or similar special character in their name we displayed the HTML entity instead in system messages. So Papa John's we would show asPapa John#34;s.
- Decreasing the window size could cause the input area to not display correctly.
- The manage services button in the add participants list will open team settings.`,
  expiresOn: '2018-10-31T00:00:00+00:00',
  fileChecksum: Buffer.from('ac56e02f1e8c0af5645bec81740b91bb3773ba371560a12838190cbf3a5979be', 'hex'),
  fileChecksumCompressed: Buffer.from('ac56e02f1e8c0af5645bec81740b91bb3773ba371560a12838190cbf3a5979be', 'hex'),
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
storiesOf('Prompt', module)
  .add('New update is available', () =>
    renderPrompt({
      changelogUrl: 'https://medium.com/@wireupdates',
      isWebappBlacklisted: false,
      isWebappTamperedWith: false,
      metadata: GENERIC_METADATA,
    })
  )
  .add('Webapp version is blacklisted', () =>
    renderPrompt({
      changelogUrl: 'https://medium.com/@wireupdates',
      isWebappBlacklisted: true,
      isWebappTamperedWith: false,
      metadata: GENERIC_METADATA,
    })
  )
  .add('Bundle is damanged', () =>
    renderPrompt({
      changelogUrl: 'https://medium.com/@wireupdates',
      isWebappBlacklisted: false,
      isWebappTamperedWith: true,
      metadata: GENERIC_METADATA,
    })
  );

storiesOf('WrapperOutdated', module).add('Wrapper version is blacklisted', () =>
  renderWrapperOutdated({environment: 'darwin'})
);
