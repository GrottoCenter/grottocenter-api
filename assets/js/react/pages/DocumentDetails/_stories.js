import React from 'react';
import { storiesOf } from '@storybook/react';
import { Public, Terrain } from '@material-ui/icons';

import data from './data.json';
import Section from './Section';
import CustomIcon from '../../components/common/CustomIcon';
import Overview from './Overview';

storiesOf('Document details', module).add('Overview', () => (
  <Overview {...data} />
));

storiesOf('Document details', module).add('Section', () => (
  <Section
    title="Section title"
    content={[
      {
        Icon: () => <Terrain fontSize="large" color="primary" />,
        label: 'Massif',
        value: 'Sainte-Baume (massif de la)',
      },
      {
        Icon: () => <Public fontSize="large" color="primary" />,
        label: 'Région',
        value: 'France Languedoc / Rousillon',
      },
      {
        label: 'Test',
        value: 'section sans icon',
      },
      {
        Icon: () => <CustomIcon type="entry" />,
        label: 'Entrée',
        value: 'Cave aze dfe azetr',
      },
      {
        Icon: () => <CustomIcon type="cave_system" />,
        label: 'Cave',
        value: 'Miéraure (aven de) [Aven des]',
      },
    ]}
  />
));
