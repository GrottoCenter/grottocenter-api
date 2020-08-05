import React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import styled from 'styled-components';

import EntrancesSearch from './EntrancesSearch';
import GroupsSearch from './GroupsSearch';
import MassifsSearch from './MassifsSearch';
import DocumentSearch from './DocumentSearch';

import Translate from '../../common/Translate';

import SearchResultsContainer from '../../../containers/SearchResultsContainer';

const advancedSearchTypes = ['entrances', 'grottos', 'massifs', 'documents'];

const TabIcon = styled.img`
  height: 2rem;
  margin-right: 5px;
  vertical-align: middle;
  width: 2rem;
`;

const AdvancedSearch = ({
  resetAdvancedSearch,
  startAdvancedsearch,
  getSubjects,
  subjects,
}) => {
  const [selectedType, setSelectedType] = React.useState(0);

  const handleSelectType = (_event, value) => {
    setSelectedType(value);
  };

  return (
    <div>
      <Tabs
        variant="fullWidth"
        // scrollable
        // scrollButtons="off"
        value={selectedType}
        onChange={handleSelectType}
        // indicatorColor="primary"
        // textColor="primary"
      >
        <Tab
          label={
            <>
              <TabIcon src="/images/entry.svg" alt="Entry icon" />
              <Translate>Entrances</Translate>
            </>
          }
        />
        <Tab
          label={
            <>
              <TabIcon src="/images/club.svg" alt="Group icon" />
              <Translate>Groups</Translate>
            </>
          }
        />
        <Tab
          label={
            <>
              <TabIcon src="/images/massif.svg" alt="Massif icon" />
              <Translate>Massifs</Translate>
            </>
          }
        />
        <Tab
          label={
            <>
              <TabIcon src="/images/bibliography.svg" alt="Bibliography icon" />
              <Translate>Documents</Translate>
            </>
          }
        />
      </Tabs>

      <>
        {selectedType === 0 && (
          <EntrancesSearch
            startAdvancedsearch={(state, resourceType) => {
              startAdvancedsearch(state, resourceType);
            }}
            resourceType={advancedSearchTypes[0]}
            resetResults={resetAdvancedSearch}
          />
        )}
        {selectedType === 1 && (
          <GroupsSearch
            startAdvancedsearch={(state, resourceType) => {
              startAdvancedsearch(state, resourceType);
            }}
            resourceType={advancedSearchTypes[1]}
            resetResults={resetAdvancedSearch}
          />
        )}
        {selectedType === 2 && (
          <MassifsSearch
            startAdvancedsearch={(state, resourceType) => {
              startAdvancedsearch(state, resourceType);
            }}
            resourceType={advancedSearchTypes[2]}
            resetResults={resetAdvancedSearch}
          />
        )}
        {selectedType === 3 && (
          <DocumentSearch
            startAdvancedsearch={(state, resourceType) => {
              startAdvancedsearch(state, resourceType);
            }}
            resourceType={advancedSearchTypes[3]}
            resetResults={resetAdvancedSearch}
            getAllSubjects={getSubjects}
            allSubjects={subjects}
          />
        )}

        <SearchResultsContainer />
      </>
    </div>
  );
};

AdvancedSearch.propTypes = {
  resetAdvancedSearch: PropTypes.func.isRequired,
  startAdvancedsearch: PropTypes.func.isRequired,
  getSubjects: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

AdvancedSearch.defaultProps = {};

export default AdvancedSearch;
