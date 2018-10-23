import {boolean, number, withKnobs} from '@storybook/addon-knobs';
import {Installer} from '../src/main/components/Installer';
import {Prompt} from '../src/main/components/Prompt';
import React from 'react';
import {WrapperOutdated} from '../src/main/components/WrapperOutdated';
import {storiesOf} from '@storybook/react';

function installerStoryGenerator(data) {
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

storiesOf('Installer', module)
  .addDecorator(withKnobs)
  .add('Starting', () =>
    installerStoryGenerator({
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
    installerStoryGenerator({
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
    installerStoryGenerator({
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

storiesOf('Prompt', module).add('New update is available', () => <Prompt />);

storiesOf('WrapperOutdated', module)
  .add('macOS', () => <WrapperOutdated environment="Darwin" />)
  .add('others', () => <WrapperOutdated environment="win32" />);
