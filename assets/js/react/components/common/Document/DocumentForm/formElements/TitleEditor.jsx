import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { DocumentFormContext } from '../Provider';

import StringInput from './StringInput';
import LanguageSelect from './LanguageSelect';

// ===================================
const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const TitleContainer = styled.div`
  flex: 12;
  min-width: 300px;
`;

const LanguageSelectContainer = styled.div`
  flex: 5;
  min-width: 200px;
`;
// ===================================

const TitleEditor = ({
  allLanguages,
  languageHelperText,
  languageItemReferringTo,
  required = false,
}) => {
  const {
    docAttributes: { title, titleLanguage },
    updateAttribute,
  } = useContext(DocumentFormContext);

  const memoizedValues = [allLanguages, title, titleLanguage];
  return useMemo(
    () => (
      <InlineWrapper>
        <TitleContainer>
          <StringInput
            helperText="Main title of the document. Don't enter the issue number here if you are submitting a magazine for example: it will be asked later in the form."
            onValueChange={(value) => updateAttribute('title', value)}
            value={title}
            valueName="Title"
            required={required}
          />
        </TitleContainer>
        <LanguageSelectContainer>
          <LanguageSelect
            allLanguages={allLanguages}
            contextValueNameToUpdate="titleLanguage"
            helperText={languageHelperText}
            itemReferringTo={languageItemReferringTo}
            required={required}
          />
        </LanguageSelectContainer>
      </InlineWrapper>
    ),
    memoizedValues,
  );
};

TitleEditor.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  languageHelperText: PropTypes.string.isRequired,
  languageItemReferringTo: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default TitleEditor;
