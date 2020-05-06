import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import StringInput from './StringInput';
import LanguageSelect from './LanguageSelect';

// ===================================
const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

const TitleContainer = styled.div`
  flex: 10;
`;

const LanguageSelectContainer = styled.div`
  flex: 3;
`;
// ===================================

const TitleEditor = ({
  title,
  onTitleChange,
  language,
  languageHelperText,
  languageItemReferringTo,
  onLanguageChange,
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
  onTitleChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  languageHelperText: PropTypes.string.isRequired,
  languageItemReferringTo: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
};

export default TitleEditor;
