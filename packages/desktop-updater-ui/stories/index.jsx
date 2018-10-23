import {boolean, number, withKnobs} from '@storybook/addon-knobs/react';
import {Installer} from '../src/main/components/Installer';
import {Prompt} from '../src/main/components/Prompt';
import React from 'react';
import {WrapperOutdated} from '../src/main/components/WrapperOutdated';
import {storiesOf} from '@storybook/react';

const installerFakeData = {
  elapsed: 8.607,
  percent: 0.847333998771668,
  remaining: 1.551,
  speed: 736159.288950854,
  startedAt: 1518433467150,
  total: 7477716,
  transferred: 6336123,
};

storiesOf('Installer', module)
  .addDecorator(withKnobs)
  .add('Starting', () => <Installer />)
  .add('In progress', () => <Installer installing={false} progress={installerFakeData} />)
  .add('Finished', () => <Installer installing={true} progress={installerFakeData} />)
  .add('Custom', () => {
    const TOTAL_PERCENTAGE = 100;
    const elapsed = number('Elapsed time (seconds)', installerFakeData.elapsed);
    const installing = boolean('Are we installing?', false);
    const percent = number('Percentage (0-100)', installerFakeData.percent);
    const remaining = number('Remaining time (seconds)', installerFakeData.remaining);
    const speed = number('Current downloading speed (in bytes)', installerFakeData.speed);
    const startedAt = number('Started at (unix timestamp)', installerFakeData.startedAt);
    const total = number('Total size (in bytes)', installerFakeData.total);
    const transferred = number('Transferred size (in bytes)', installerFakeData.transferred);

    return (
      <Installer
        installing={installing}
        progress={{
          elapsed,
          percent: percent * TOTAL_PERCENTAGE,
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
  .add('Desktop wrapper is outdated on macOS', () => <WrapperOutdated environment="Darwin" />)
  .add('Desktop wrapper is outdated (others)', () => <WrapperOutdated environment="win32" />);
