import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { DocumentFormContext } from '../Provider';

import StringInput from '../../../../common/Form/StringInput';

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

// ===================================

const DescriptionEditor = ({ allLanguages, required = false }) => {
  const {
    docAttributes: { description },
    updateAttribute,
  } = useContext(DocumentFormContext);

  const memoizedValues = [allLanguages, description];
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
  required: PropTypes.bool,
};

export default DescriptionEditor;
