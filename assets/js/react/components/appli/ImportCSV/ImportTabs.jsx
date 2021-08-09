import React, { useContext } from 'react';
import styled from 'styled-components';
import { Tab, Tabs } from '@material-ui/core';
import Translate from '../../common/Translate';
import { ImportPageContentContext } from './Provider';
import { DOCUMENT, ENTRANCE } from './constants';

const TabIcon = styled.img`
  height: 2rem;
  margin-right: 5px;
  vertical-align: middle;
  width: 2rem;
`;

const ImportTabs = () => {
  const { currentStep, selectedType, updateAttribute } = useContext(
    ImportPageContentContext,
  );

  const handleSelectType = (_event, value) => {
    updateAttribute('selectedType', value);
    updateAttribute('importData', []);
    updateAttribute('validatedSteps', [currentStep]);
  };

  return (
    <Tabs variant="standard" value={selectedType} onChange={handleSelectType}>
      <Tab
        label={
          <>
            <TabIcon src="/images/entry.svg" alt="Entry icon" />
            <Translate>Entrances</Translate>
          </>
        }
        disabled={currentStep > 1 && selectedType === DOCUMENT}
      />
      <Tab
        label={
          <>
            <TabIcon src="/images/bibliography.svg" alt="Bibliography icon" />
            <Translate>Documents</Translate>
          </>
        }
        disabled={currentStep > 1 && selectedType === ENTRANCE}
      />
    </Tabs>
  );
};
ImportTabs.propTypes = {};

export default ImportTabs;
