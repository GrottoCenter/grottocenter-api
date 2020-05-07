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

const TitleContainer = styled.div`
  flex: 10;
  flex-basis: 400px;
`;

const LanguageSelectContainer = styled.div`
  flex: 3;
  flex-basis: 200px;
`;
// ===================================

const TitleEditor = ({
  allLanguages,
  language,
  languageHelperText,
  languageItemReferringTo,
  onLanguageChange,
  onTitleChange,
  title,
}) => {
  return (
    <InlineWrapper>
      <TitleContainer>
        <StringInput
          helperText="Some helper text for Title"
          onValueChange={onTitleChange}
          value={title}
          valueName="Title"
          required
        />
      </TitleContainer>
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

TitleEditor.propTypes = {
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
  onTitleChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default TitleEditor;
