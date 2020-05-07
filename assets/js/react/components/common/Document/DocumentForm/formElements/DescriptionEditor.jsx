import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import StringInput from './StringInput';
import LanguageSelect from './LanguageSelect';

// ===================================
const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const DescriptionContainer = styled.div`
  flex: 10;
  flex-basis: 400px;
`;

const LanguageSelectContainer = styled.div`
  flex: 3;
  flex-basis: 200px;
`;
// ===================================

const DescriptionEditor = ({
  allLanguages,
  language,
  languageHelperText,
  languageItemReferringTo,
  onLanguageChange,
  onDescriptionChange,
  description,
}) => {
  return (
    <InlineWrapper>
      <DescriptionContainer>
        <StringInput
          helperText="Some helper text for Description"
          onValueChange={onDescriptionChange}
          value={description}
          valueName="Description"
          required
          multiline
        />
      </DescriptionContainer>
      <LanguageSelectContainer>
        <LanguageSelect
          allLanguages={allLanguages}
          itemReferringTo={languageItemReferringTo}
          helperText={languageHelperText}
          required
          language={language}
          onLanguageChange={onLanguageChange}
        />
      </LanguageSelectContainer>
    </InlineWrapper>
  );
};

DescriptionEditor.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  language: PropTypes.string.isRequired,
  languageHelperText: PropTypes.string.isRequired,
  languageItemReferringTo: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
};

export default DescriptionEditor;
