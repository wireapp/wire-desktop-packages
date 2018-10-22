import {Installer} from '../src/main/components/Installer';
import React from 'react';
import {storiesOf} from '@storybook/react';

storiesOf('Installer')
  .add('0% loaded', () => <Installer />)
  .add('100% loaded', () => <Installer />);
