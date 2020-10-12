import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import Translate from '../components/common/Translate';
import { loadSubjects } from '../actions/Subject';

import MultipleSelectWithOptionsComponent from '../components/appli/Document/DocumentForm/formElements/MultipleSelectWithOptions';

const MultipleSubjectsSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false,
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { isFetching, subjects } = useSelector((state) => state.subject);

  React.useEffect(() => {
    dispatch(loadSubjects());
  }, []);

  return (
    <MultipleSelectWithOptionsComponent
      computeHasError={computeHasError}
      contextValueName={contextValueName}
      getOptionLabel={(option) => {
        const { code } = option;
        const subjectName = formatMessage({
          id: option.code,
          defaultMessage: option.subject,
        });
        let parentText = '';
        if (option.parent) {
          // Indent if there is a parent.
          parentText = '\u00a0\u00a0\u00a0\u00a0';
        }
        return `${parentText} ${code} ${subjectName}`;
      }}
      getOptionSelected={(optionToTest, valueToTest) =>
        optionToTest.code === valueToTest.code
      }
      helperText={helperText}
      isLoading={isFetching}
      labelName={labelName}
      noOptionsText={
        <Translate>No subject matches you search criteria</Translate>
      }
      options={subjects}
      required={required}
    />
  );
};

MultipleSubjectsSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool,
};

export default MultipleSubjectsSelect;
