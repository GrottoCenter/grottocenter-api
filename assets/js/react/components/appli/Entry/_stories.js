import React from 'react';
import { storiesOf } from '@storybook/react';
import { Card as MuiCard, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { boolean } from '@storybook/addon-knobs';

import Properties from './Properties';
import EntryMap from './EntryMap';
import Provider from './Provider';
import { Entry } from './index';
import Layout from '../../common/Layouts/Main';
import { Search } from '../../common/Layouts/Main/_stories';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';

const date = new Date('2015-03');
const today = new Date();

const details = {
  name: 'Petit Saint-Cassien (Gouffre du)',
  localisation:
    "Nans-les-Pins, Var (83), Provence-Alpes-Côte d'Azur (PAC), FRANCE",
  depth: 403,
  development: 10865,
  interestRate: 3.5,
  progressionRate: 2.5,
  accessRate: 1.5,
  author: 'Author name',
  creationDate: date.toISOString().substring(0, 10),
  lastEditor: 'Editor name',
  editionDate: today.toISOString().substring(0, 10),
  undergroundType: 'Karstic (all carbonate rocks)',
  discoveryYear: 1925,
  coordinates: [43.35266, 5.81689],
  mountain: 'Sainte-Baume (massif de la)',
  altitude: 748,
  isDivingCave: true,
};

const Card = styled(MuiCard)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const Content = ({ title }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      title={formatMessage({ id: title })}
      content={
        <Typography>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec mattis
          pretium massa. Aliquam erat volutpat. Nulla facilisi. Donec vulputate
          interdum sollicitudin. Nunc lacinia auctor quam sed pellentesque.
          Aliquam dui mauris, mattis quis lacus id, pellentesque lobortis odio.
        </Typography>
      }
      footer={formatMessage({ id: 'Created by' })}
    />
  );
};

Content.propTypes = {
  title: PropTypes.string.isRequired,
};

// eslint-disable-next-line react/prop-types
const StoryContextProvider = ({ loading, children }) => (
  <Provider loading={loading} details={details}>
    {children}
  </Provider>
);

const PropertiesWithState = () => {
  return (
    <>
      <EntryMap />
      <Properties />
    </>
  );
};

const MapWithState = () => {
  return (
    <Card style={{ width: '500px' }}>
      <EntryMap />
    </Card>
  );
};

const EntryWithContent = () => (
  <Entry>
    <>
      <Content title="Localisation" />
      <Content title="Description" />
      <Content title="Topography" />
      <Content title="Equipments" />
      <Content title="History" />
      <Content title="Comments" />
      <Content title="Bibliography" />
    </>
  </Entry>
);

const WithLayout = () => {
  const [isSideMenuOpen, setToggleSideMenu] = React.useState(false);

  const toggleSideMenu = () => {
    setToggleSideMenu(!isSideMenuOpen);
  };

  return (
    <Layout
      isSideMenuOpen={isSideMenuOpen}
      toggleSideMenu={toggleSideMenu}
      HeaderQuickSearch={Search}
      SideBarQuickSearch={Search}
    >
      <EntryWithContent />
    </Layout>
  );
};

storiesOf('Entry', module)
  .addDecorator((storyFn) => (
    <StoryContextProvider loading={boolean('Loading', false)}>
      {storyFn()}
    </StoryContextProvider>
  ))
  .add('Map', () => <MapWithState />)
  .add('Properties', () => <PropertiesWithState />)
  .add('With Fixed-Content layout', () => <EntryWithContent />)
  .add('With Fixed-Content and Main Layout', () => (
    <WithLayout loading={boolean('Loading', false)} />
  ));
