import React, { useContext, useMemo } from 'react';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';
import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';
import NumberInput from '../../../../common/Form/NumberInput';
import StringInput from '../../../../common/Form/StringInput';

// ===================================
const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const InputWrapper = styled.div`
  flex: 1;
`;

const IntervalErrorWrapper = styled.div`
  width: 100%;
`;

const PageIntervalWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

// ===================================

const PagesEditor = () => {
  const [intervalError, setIntervalError] = React.useState('');
  const [positiveEndError, setPositiveEndError] = React.useState('');
  const [positiveStartError, setPositiveStartError] = React.useState('');
  const {
    docAttributes: { endPage, pageComment, startPage },
    updateAttribute,
  } = useContext(DocumentFormContext);

  React.useEffect(() => {
    const newEndGreater =
      startPage > endPage
        ? 'The end page must be greater or equal to the start page.'
        : '';
    if (newEndGreater !== intervalError) setIntervalError(newEndGreater);

    const newPositiveEnd = endPage < 0 ? 'The end page must be positive.' : '';
    if (newPositiveEnd !== positiveEndError)
      setPositiveEndError(newPositiveEnd);

    const newPositiveStart =
      startPage < 0 ? 'The start page must be positive.' : '';
    if (newPositiveStart !== positiveStartError)
      setPositiveStartError(newPositiveStart);
  });

  const handleValueChange = (contextValueName, newValue) => {
    updateAttribute(contextValueName, newValue);
  };

  const memoizedValues = [
    endPage,
    pageComment,
    startPage,
    intervalError,
    positiveEndError,
    positiveStartError,
  ];
  return useMemo(
    () => (
      <>
        <InlineWrapper>
          <PageIntervalWrapper>
            {intervalError !== '' && (
              <IntervalErrorWrapper>
                <Typography align="center" color="error">
                  <Translate>{intervalError}</Translate>
                </Typography>
              </IntervalErrorWrapper>
            )}
            <InputWrapper>
              {positiveStartError !== '' && (
                <Typography align="center" color="error">
                  <Translate>{positiveStartError}</Translate>
                </Typography>
              )}
              <NumberInput
                hasError={positiveStartError !== '' || intervalError !== ''}
                helperText="Page where the document starts if it's part of another document (ex: an article in a magazine). Leave it blank if you just want to mention the total number of pages (ex: a book)."
                onValueChange={(newValue) =>
                  handleValueChange('startPage', newValue)
                }
                value={startPage}
                valueName="Start Page"
              />
            </InputWrapper>
            <InputWrapper>
              {positiveEndError !== '' && (
                <Typography align="center" color="error">
                  <Translate>{positiveEndError}</Translate>
                </Typography>
              )}
              <NumberInput
                hasError={positiveEndError !== '' || intervalError !== ''}
                helperText="Page where the document ends if it's part of another document (ex: an article in a magazine)."
                onValueChange={(newValue) =>
                  handleValueChange('endPage', newValue)
                }
                value={endPage}
                valueName="End Page"
              />
            </InputWrapper>
          </PageIntervalWrapper>
          <InputWrapper>
            <StringInput
              hasError={false}
              helperText='Additional information about the pages where the document is located (example with an article from pages 10 to 15: "There are ads from page 12 to 14.").'
              onValueChange={(newValue) =>
                handleValueChange('pageComment', newValue)
              }
              value={pageComment}
              valueName="Page Comment"
            />
          </InputWrapper>
        </InlineWrapper>
      </>
    ),
    memoizedValues,
  );
};

PagesEditor.propTypes = {};

export default PagesEditor;
