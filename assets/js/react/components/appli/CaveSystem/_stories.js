import React, { useContext } from 'react';
import { storiesOf } from '@storybook/react';
import { Typography } from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';
import DocumentIcon from '@material-ui/icons/Filter';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { boolean } from '@storybook/addon-knobs';

import Provider, { CaveContext } from './Provider';
import Layout from '../../common/Layouts/Main';
import { Search, FakeAppBar } from '../../common/Layouts/Main/_stories';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import Properties from './Properties';
import { CaveSystem } from './index';
import EntriesSelection from './EntriesSelection';
import EntriesList from './EntriesList';

const date = new Date('2015-03');
const today = new Date();

const data = {
  name: 'Félix Trombe',
  localisation:
    "Nans-les-Pins, Var (83), Provence-Alpes-Côte d'Azur (PAC), FRANCE",
  depth: 1004,
  altitude: 748,
  development: 105767,
  interestRate: 3.5,
  progressionRate: 2.5,
  accessRate: 1.5,
  author: 'Author name',
  creationDate: date.toISOString().substring(0, 10),
  lastEditor: 'Editor name',
  editionDate: today.toISOString().substring(0, 10),
  undergroundType: 'Karstic (all carbonate rocks)',
  discoveryYear: 1925,
  mountain: 'ARbas (massif d)',
  isDivingCave: true,
  entries: [
    {
      id: 'entry1',
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
      latitude: 43.35266,
      longitude: 5.81689,
      mountain: 'Sainte-Baume (massif de la)',
      altitude: 748,
      isDivingCave: true,
    },
    {
      id: 'entry2',
      name: '2 eme entrée (Gouffre du)',
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
      latitude: 43.35766,
      longitude: 5.82089,
      mountain: 'Sainte-Baume (massif de la)',
      altitude: 748,
      isDivingCave: true,
    },
  ],
};

const Content = ({ title, icon }) => {
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
      icon={icon}
    />
  );
};

Content.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element,
};

// eslint-disable-next-line react/prop-types
const StoryContextProvider = ({ loading, children }) => (
  <Provider loading={loading} data={data}>
    {children}
  </Provider>
);

const EntryWithContent = () => (
  <CaveSystem>
    <>
      <EntriesList />
      <Content title="Description" icon={<DescriptionIcon color="primary" />} />
      <Content title="Documents" icon={<DocumentIcon color="primary" />} />
    </>
  </CaveSystem>
);

const WithLayout = () => {
  const [isSideMenuOpen, setToggleSideMenu] = React.useState(false);

  const toggleSideMenu = () => {
    setToggleSideMenu(!isSideMenuOpen);
  };

  return (
    <Layout
      AppBar={FakeAppBar}
      isSideMenuOpen={isSideMenuOpen}
      toggleSideMenu={toggleSideMenu}
      HeaderQuickSearch={Search}
      SideBarQuickSearch={Search}
    >
      <EntryWithContent />
    </Layout>
  );
};

// eslint-disable-next-line react/prop-types
const WithStateEntriesList = ({ loading }) => {
  const {
    state: { selectedEntries, entries },
    action: { onSelectEntry },
  } = useContext(CaveContext);

  return (
    <EntriesSelection
      onSelect={onSelectEntry}
      entries={entries}
      selection={selectedEntries}
      loading={loading}
    />
  );
};

storiesOf('Cave system', module)
  .addDecorator((storyFn) => (
    <StoryContextProvider loading={boolean('Loading', false)}>
      {storyFn()}
    </StoryContextProvider>
  ))
  .add('Entries selection', () => (
    <WithStateEntriesList loading={boolean('Loading', false)} />
  ))
  .add('Entries list', () => <EntriesList />)
  .add('Properties', () => <Properties />)
  .add('With Layouts', () => (
    <WithLayout loading={boolean('Loading', false)} />
  ));
