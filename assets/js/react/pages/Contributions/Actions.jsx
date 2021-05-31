import React from 'react';
import {isNil, anyPass, isEmpty, head} from 'ramda';
import PropTypes from 'prop-types';
import {useIntl} from 'react-intl';
import styled from 'styled-components';
import {useSelector} from 'react-redux';
import EditIcon from '@material-ui/icons/Edit';
import ActionButton from '../../components/common/ActionButton';

const ActionTypes = {
  edit: {
    confirmationText: '',
    helperText: '',
    name: 'Edit',
  }
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${({theme}) => theme.spacing(3)}px;
  & > button {
    margin-right: ${({theme}) => theme.spacing(2)}px;
  }
`;

const isNilOrEmpty = anyPass([isNil, isEmpty]);

const Actions = ({selected, onEdit}) => {
  const {formatMessage} = useIntl();
  const {isLoading} = useSelector((state) => state.processDocuments);

  const handleEdit = () => {
    if (!isEmpty(selected)) {
      onEdit(head(selected));
    }
  };

  return (
    <Wrapper>
      <ActionButton
        label={formatMessage({id: ActionTypes.edit.name})}
        disabled={isNilOrEmpty(selected) || isLoading || selected.length > 1}
        onClick={handleEdit}
        icon={<EditIcon/>}
      />
    </Wrapper>
  );
};

export default Actions;

Actions.propTypes = {
  selected: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.number.isRequired,
      PropTypes.string.isRequired,
    ]),
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
};
