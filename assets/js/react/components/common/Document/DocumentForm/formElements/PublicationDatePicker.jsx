import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import DateFnsUtils from '@date-io/date-fns';
import { FormHelperText } from '@material-ui/core';
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import Translate from '../../../Translate';

// ===================================

const CustomKeyboardDatePicker = styled(KeyboardDatePicker)`
  margin: 0;
`;
// ===================================

const PublicationDatePicker = ({
  onPublicationDateChange,
  publicationDate,
}) => {
  const handlePublicationDateChange = (date) => {
    onPublicationDateChange(date);
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
  return (
    <>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <CustomKeyboardDatePicker
          inputVariant="filled"
          margin="normal"
          id="date-picker-dialog"
          label={<Translate>Publication Date</Translate>}
          format="dd/MM/yyyy"
          value={publicationDate}
          onChange={handlePublicationDateChange}
          KeyboardButtonProps={{
            'aria-label': 'change date',
          }}
          minDate={new Date('1000-01-01')}
          invalidDateMessage={<Translate>Invalid Date Format</Translate>}
          disableFuture
          FormHelperTextProps={formHelperProps}
        />
      </MuiPickersUtilsProvider>
    </>
  );
};

PublicationDatePicker.propTypes = {
  onPublicationDateChange: PropTypes.func.isRequired,
  publicationDate: PropTypes.instanceOf(Date),
};

export default PublicationDatePicker;
