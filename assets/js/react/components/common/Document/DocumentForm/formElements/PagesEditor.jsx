import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';
import Translate from '../../../Translate';
import NumberInput from './NumberInput';
import StringInput from './StringInput';

// ===================================
const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const InputWrapper = styled.div`
  flex: 1;
`;
// ===================================

const PagesEditor = ({
  endPage,
  pageComment,
  startPage,
  onEndPageChange,
  onPageCommentChange,
  onStartPageChange,
}) => {
  const [intervalError, setIntervalError] = React.useState('');
  const [positiveEndError, setPositiveEndError] = React.useState('');
  const [positiveStartError, setPositiveStartError] = React.useState('');

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

  return (
    <>
      {intervalError !== '' && (
        <Typography align="center" color="error">
          <Translate>{intervalError}</Translate>
        </Typography>
      )}

      <InlineWrapper>
        <InputWrapper>
          {positiveStartError !== '' && (
            <Typography align="center" color="error">
              <Translate>{positiveStartError}</Translate>
            </Typography>
          )}
          <NumberInput
            hasError={positiveStartError !== '' || intervalError !== ''}
            helperText="Page where the document starts if it's part of another document (ex: an article in a magazine). Leave it blank if you just want to mention the total number of pages (ex: a book)."
            onValueChange={onStartPageChange}
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
            onValueChange={onEndPageChange}
            value={endPage}
            valueName="End Page"
          />
        </InputWrapper>
        <InputWrapper>
          <StringInput
            hasError={false}
            helperText='Additional information about the pages where the document is located (example with an article from pages 10 to 15: "There are adds from page 12 to 14.").'
            onValueChange={onPageCommentChange}
            value={pageComment}
            valueName="Page Comment"
          />
        </InputWrapper>
      </InlineWrapper>
    </>
  );
};

PagesEditor.propTypes = {
  endPage: PropTypes.number.isRequired,
  pageComment: PropTypes.string.isRequired,
  startPage: PropTypes.number.isRequired,
  onEndPageChange: PropTypes.func.isRequired,
  onPageCommentChange: PropTypes.func.isRequired,
  onStartPageChange: PropTypes.func.isRequired,
};

export default PagesEditor;
