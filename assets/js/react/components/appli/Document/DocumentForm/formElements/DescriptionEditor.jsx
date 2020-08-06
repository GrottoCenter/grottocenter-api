import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { DocumentFormContext } from '../Provider';

import StringInput from '../../../../common/Form/StringInput';
import LanguageSelect from './LanguageSelect';

// ===================================
const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const DescriptionContainer = styled.div`
  flex: 12;
  flex-basis: 300px;
`;

const LanguageSelectContainer = styled.div`
  flex: 5;
  min-width: 230px;
`;
// ===================================

const DescriptionEditor = ({
  allLanguages,
  languageHelperText,
  languageItemReferringTo,
  required = false,
}) => {
  const {
    docAttributes: { description, descriptionLanguage },
    updateAttribute,
  } = useContext(DocumentFormContext);

  const memoizedValues = [allLanguages, description, descriptionLanguage];
  return useMemo(
    () => (
      <InlineWrapper>
        <DescriptionContainer>
          <StringInput
            helperText={
              'Try to go straight to the point, mention keywords and be precise. Don\'t start with "this document is about...".'
            }
            multiline
            onValueChange={(value) => updateAttribute('description', value)}
            required={required}
            value={description}
            valueName="Description"
          />
        </DescriptionContainer>
        <LanguageSelectContainer>
          <LanguageSelect
            allLanguages={allLanguages}
            contextValueNameToUpdate="descriptionLanguage"
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

DescriptionEditor.propTypes = {
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

export default DescriptionEditor;
