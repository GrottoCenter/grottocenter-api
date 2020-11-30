import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

import { DocumentFormContext } from '../Provider';

import StringInput from '../../../../common/Form/StringInput';

// ===================================

const TitleContainer = styled.div`
  flex: 12;
  min-width: 300px;
`;

// ===================================

const TitleEditor = ({ required = false }) => {
  const {
    docAttributes: { title },
    updateAttribute,
  } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();

  const memoizedValues = [title];
  return useMemo(
    () => (
      <TitleContainer>
        <StringInput
          helperText={formatMessage({
            id:
              'Copy the title of the text as it is. In its absence, put a fictitious title between [].',
          })}
          onValueChange={(value) => updateAttribute('title', value)}
          value={title}
          valueName={formatMessage({ id: 'Title' })}
          required={required}
        />
      </TitleContainer>
    ),
    memoizedValues,
  );
};

TitleEditor.propTypes = {
  required: PropTypes.bool,
};

export default TitleEditor;
