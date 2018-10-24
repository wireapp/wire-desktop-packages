import * as Long from 'long';
import {addDecorator, storiesOf} from '@storybook/react';
import {boolean, number, select, withKnobs} from '@storybook/addon-knobs';
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
      metadata={metadata}
      changelogUrl={changelogUrl}
      isWebappBlacklisted={isWebappBlacklisted}
      isWebappTamperedWith={isWebappTamperedWith}
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
        environment,
        'platformSelection'
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

storiesOf('Prompt', module).add('New update is available', () =>
  renderPrompt({
    changelogUrl: 'https://wire.com',
    isWebappBlacklisted: false,
    isWebappTamperedWith: false,
    metadata: {
      author: ['Wire Swiss GmbH'],
      changelog: `### Improved
- Suggestions for mentions get more real estate.
### Fixed
- The cursor in the input bar was off for right-to-left languages.
- If someone used ' or similar special character in their name we displayed the HTML entity instead in system messages. So Papa John's we would show asPapa John#34;s.
- Decreasing the window size could cause the input area to not display correctly.
- The manage services button in the add participants list will open team settings.`,
      expiresOn: '2018-10-31T00:00:00+00:00',
      /* eslint-disable no-magic-numbers */
      fileChecksum: Buffer.alloc(32, 12),
      fileChecksumCompressed: Buffer.alloc(32, 34),
      fileContentLength: Long.fromNumber(9498238),
      /* eslint-enable no-magic-numbers */
      minimumClientVersion: '2.4.3',
      minimumWebAppVersion: '2018-10-23-12-05-prod',
      releaseDate: '2018-10-17T00:00:00+00:00',
      specVersion: 1,
      targetEnvironment: 'INTERNAL',
      webappVersionNumber: '2018-10-23-12-05-prod',
    },
  })
);

storiesOf('WrapperOutdated', module)
  .add('macOS', () => renderWrapperOutdated({environment: 'darwin'}))
  .add('Others', () => renderWrapperOutdated({environment: 'win32'}));
