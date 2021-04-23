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
import { set as setDate } from 'date-fns';
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

const dateTypeFormats = {
  YEAR: 'yyyy',
  YEAR_MONTH: 'MM/yyyy',
  YEAR_MONTH_DAY: 'dd/MM/yyyy',
};

const PublicationDatePicker = ({ required = false }) => {
  const { formatMessage } = useIntl();
  const {
    docAttributes: { publicationDate },
    updateAttribute,
  } = useContext(DocumentFormContext);
  const [dateTypes, setDateTypes] = React.useState(
    // Default date format type is deduced from the publicationDate
    publicationDate === ''
      ? ['year', 'month', 'date']
      : ['year', 'month', 'date'].slice(0, publicationDate.split('-').length),
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const handleDateTypesChanges = (newTypes) => {
    if (newTypes !== dateTypes) {
      setDateTypes(newTypes);
      setIsDatePickerOpen(true);
    }
  };

  const getDisplayedDateFormat = () => {
    if (dateTypes.includes('month')) {
      if (dateTypes.includes('date')) {
        return dateTypeFormats.YEAR_MONTH_DAY;
      }
      return dateTypeFormats.YEAR_MONTH;
    }
    return dateTypeFormats.YEAR;
  };

  /**
   * Cast the new Date picked from a Date object to a string
   * (according to the date format selected) and update it in the Provider.
   * The string format used is yyyy-MM-dd.
   * For month and day < 10, we should add a 0 before it.
   * EXAMPLE :
   *      - 5/3/1996 and YEAR_MONTH_DAY format => '1996-03-05'
   *      - 5/3/1996 and YEAR_MONTH format => '1996-03'
   *      - 5/3/1996 and YEAR format => '1996'
   *
   * @param {Date} newDate
   */
  const handleDateChange = (newDate) => {
    if (newDate === null) {
      updateAttribute('publicationDate', '');
      return;
    }
    const year = newDate.getFullYear();
    const month = newDate.getMonth() + 1;
    const day = newDate.getDate();
    if (getDisplayedDateFormat() === dateTypeFormats.YEAR) {
      updateAttribute('publicationDate', String(year));
    } else if (getDisplayedDateFormat() === dateTypeFormats.YEAR_MONTH) {
      updateAttribute(
        'publicationDate',
        `${year}-${month < 10 ? `0${month}` : month}`,
      );
    } else {
      updateAttribute(
        'publicationDate',
        `${year}-${month < 10 ? `0${month}` : month}-${
          day < 10 ? `0${day}` : day
        }`,
      );
    }
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

  /**
   * From a given date string with format 'yyyy-MM-dd' with
   * MM and dd optional, return a JS Date.
   * MM is getMonth() JS Date API month + 1.
   * If the string is empty, return null.
   * @param {String} dateString
   */
  const getDateObjFromDateString = (dateString) => {
    if (dateString === '') return null;
    const splittedDate = dateString.split('-');
    return setDate(new Date(), {
      year: splittedDate[0],
      month: splittedDate.length > 1 ? splittedDate[1] - 1 : undefined,
      date: splittedDate.length > 2 ? splittedDate[2] : undefined,
    });
  };

  const memoizedValues = [
    dateTypes,
    isDatePickerOpen,
    publicationDate,
    required,
  ];

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
            value={getDateObjFromDateString(publicationDate)}
            onChange={(date) => handleDateChange(date)}
            KeyboardButtonProps={{
              'aria-label': 'change date',
            }}
            minDate={new Date('1000-01-01')}
            invalidDateMessage={<Translate>Invalid Date Format</Translate>}
            disableFuture
            FormHelperTextProps={formHelperProps}
            required={required}
            error={required && publicationDate === ''}
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
