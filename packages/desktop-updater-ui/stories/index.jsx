import {H2} from '@wireapp/react-ui-kit';
import React from 'react';
import {storiesOf} from '@storybook/react';

storiesOf('Installer')
  .add('0% loaded', () => <H2>Title</H2>)
  .add('100% loaded', () => <p>With Emojo</p>);
