import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import DateFnsUtils from '@date-io/date-fns';
import { Button, FormHelperText } from '@material-ui/core';
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import Translate from '../../../../common/Translate';

import { DocumentFormContext } from '../Provider';

// ===================================

const CustomKeyboardDatePicker = styled(KeyboardDatePicker)`
  margin: 0;
  width: 100%;
`;

const ButtonsFlexWrapper = styled.div`
  display: flex;
  padding: 4px;
`;

const DateButton = styled(Button)`
  flex: 1;
`;
// ===================================

const PublicationDatePicker = ({ required = false }) => {
  const { formatMessage } = useIntl();
  const [dateTypes, setDateTypes] = React.useState(['year', 'month', 'date']);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const handleDateTypesChanges = (newTypes) => {
    if (newTypes !== dateTypes) {
      setDateTypes(newTypes);
      setIsDatePickerOpen(true);
    }
  };

  const {
    docAttributes: { publicationDate },
    updateAttribute,
  } = useContext(DocumentFormContext);

  const getDisplayedDateFormat = () => {
    if (dateTypes.includes('month')) {
      if (dateTypes.includes('date')) {
        return 'dd/MM/yyyy';
      }
      return 'MM/yyyy';
    }
    return 'yyyy';
  };

  const formHelperProps = {
    component: (props) => {
      /* eslint-disable react/prop-types */
      const { children } = props;
      let textToDisplay = children;
      if (children && children.props) {
        textToDisplay = children.props.children; // I don't really understand why it's nested like this: should be just props.children once no?
      }
      /* eslint-enable react/prop-types */
      return (
        <FormHelperText>
          <Translate>{textToDisplay}</Translate>
        </FormHelperText>
      );
    },
  };

  const memoizedValues = [
    dateTypes,
    isDatePickerOpen,
    publicationDate,
    required,
  ];

  const isAValidDate = (d) => {
    return d !== null && d instanceof Date && !Number.isNaN(d.getTime());
  };

  const hasError =
    (required &&
      (publicationDate === null || !isAValidDate(publicationDate))) ||
    (!required && publicationDate !== null && !isAValidDate(publicationDate));

  return useMemo(
    () => (
      <>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <CustomKeyboardDatePicker
            inputVariant="filled"
            margin="normal"
            id="date-picker-dialog"
            label={<Translate>Publication Date</Translate>}
            format={getDisplayedDateFormat()}
            value={publicationDate}
            onChange={(date) => updateAttribute('publicationDate', date)}
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}
            minDate={new Date('1000-01-01')}
            invalidDateMessage={<Translate>Invalid Date Format</Translate>}
            disableFuture
            FormHelperTextProps={formHelperProps}
            required={required}
            error={hasError}
            views={dateTypes}
            open={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            onOpen={() => setIsDatePickerOpen(true)}
            cancelLabel={formatMessage({ id: 'Cancel' })}
            okLabel={formatMessage({ id: 'Ok' })}
          />
          <ButtonsFlexWrapper>
            <DateButton
              color="primary"
              size="small"
              onClick={() => handleDateTypesChanges(['year'])}
            >
              <Translate>Year</Translate>
            </DateButton>
            <DateButton
              color="primary"
              size="small"
              style={{ margin: '0 4px' }}
              onClick={() => handleDateTypesChanges(['year', 'month'])}
            >
              <Translate>Year & Month</Translate>
            </DateButton>
            <DateButton
              color="primary"
              size="small"
              onClick={() => handleDateTypesChanges(['year', 'month', 'date'])}
            >
              <Translate>Full Date</Translate>
            </DateButton>
          </ButtonsFlexWrapper>
          <FormHelperText>
            <Translate>
              Date on which the document you submit was made public. You can
              refer to the date indicated on the document.
            </Translate>
          </FormHelperText>
        </MuiPickersUtilsProvider>
      </>
    ),
    memoizedValues,
  );
};

PublicationDatePicker.propTypes = {
  required: PropTypes.bool,
};

export default PublicationDatePicker;
