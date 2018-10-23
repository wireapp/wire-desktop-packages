import {boolean, number, withKnobs} from '@storybook/addon-knobs';
import {Installer} from '../src/main/components/Installer';
import {Prompt} from '../src/main/components/Prompt';
import React from 'react';
import {WrapperOutdated} from '../src/main/components/WrapperOutdated';
import {storiesOf} from '@storybook/react';

const installerFakeData = {
  elapsed: 8,
  percent: 0.84,
  remaining: 2,
  speed: 736159,
  startedAt: 1518433467150,
  total: 7477716,
  transferred: 6336123,
};

storiesOf('Installer', module)
  .addDecorator(withKnobs)
  .add('Starting', () => <Installer />)
  .add('In progress', () => <Installer installing={false} progress={installerFakeData} />)
  .add('Finished', () => <Installer installing={true} progress={{...installerFakeData, percent: null}} />)
  .add('Custom', () => {
    const TOTAL_PERCENTAGE = 0;
    const elapsed = number('Elapsed time (seconds)', installerFakeData.elapsed);
    const installing = boolean('Are we installing?', true);
    const percent = number('Percentage (0-100)', installerFakeData.percent * TOTAL_PERCENTAGE);
    const remaining = number('Remaining time (in seconds)', installerFakeData.remaining);
    const speed = number('Current downloading speed (in bytes)', installerFakeData.speed);
    const startedAt = number('Started at (unix timestamp)', installerFakeData.startedAt);
    const total = number('Total size (in bytes)', installerFakeData.total);
    const transferred = number('Transferred size (in bytes)', installerFakeData.transferred);

    return (
      <Installer
        installing={installing}
        progress={{
          elapsed,
          percent: percent === 0 ? null : percent / TOTAL_PERCENTAGE,
          remaining,
          speed,
          startedAt,
          total,
          transferred,
        }}
      />
    );
  });

storiesOf('Prompt', module).add('New update is available', () => <Prompt />);

storiesOf('WrapperOutdated', module)
  .add('macOS', () => <WrapperOutdated environment="Darwin" />)
  .add('others', () => <WrapperOutdated environment="win32" />);
