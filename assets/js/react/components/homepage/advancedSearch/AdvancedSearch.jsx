import React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import styled from 'styled-components';

import DocumentSearch from './DocumentSearch';
import EntrancesSearch from './EntrancesSearch';
import MassifsSearch from './MassifsSearch';
import OrganizationsSearch from './OrganizationsSearch';

import Translate from '../../common/Translate';

import SearchResultsContainer from '../../../containers/SearchResultsContainer';

const advancedSearchTypes = {
  ENTRANCES: 'entrances',
  ORGANIZATIONS: 'grottos',
  MASSIFS: 'massifs',
  DOCUMENTS: 'documents',
};

const TabIcon = styled.img`
  height: 2rem;
  margin-right: 5px;
  vertical-align: middle;
  width: 2rem;
`;

const AdvancedSearch = ({
  resetAdvancedSearch,
  startAdvancedsearch,
  getDocumentTypes,
  documentTypes,
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
              <TabIcon src="/images/club.svg" alt="Organization icon" />
              <Translate>Organizations</Translate>
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
            resourceType={advancedSearchTypes.ENTRANCES}
            resetResults={resetAdvancedSearch}
          />
        )}
        {selectedType === 1 && (
          <OrganizationsSearch
            startAdvancedsearch={(state, resourceType) => {
              startAdvancedsearch(state, resourceType);
            }}
            resourceType={advancedSearchTypes.ORGANIZATIONS}
            resetResults={resetAdvancedSearch}
          />
        )}
        {selectedType === 2 && (
          <MassifsSearch
            startAdvancedsearch={(state, resourceType) => {
              startAdvancedsearch(state, resourceType);
            }}
            resourceType={advancedSearchTypes.MASSIFS}
            resetResults={resetAdvancedSearch}
          />
        )}
        {selectedType === 3 && (
          <DocumentSearch
            startAdvancedsearch={(state, resourceType) => {
              startAdvancedsearch(state, resourceType);
            }}
            resourceType={advancedSearchTypes.DOCUMENTS}
            resetResults={resetAdvancedSearch}
            getAllDocumentTypes={getDocumentTypes}
            allDocumentTypes={documentTypes}
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
  getDocumentTypes: PropTypes.func.isRequired,
  documentTypes: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  getSubjects: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

AdvancedSearch.defaultProps = {};

export default AdvancedSearch;
