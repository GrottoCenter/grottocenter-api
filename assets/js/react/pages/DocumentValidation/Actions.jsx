import React, { useEffect, useState } from 'react';
import { isNil, anyPass, isEmpty } from 'ramda';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import SendIcon from '@material-ui/icons/Send';
import DeclineIcon from '@material-ui/icons/NotInterested';
import { postProcessDocuments } from '../../actions/ProcessDocuments';
import ActionButton from '../../components/common/ActionButton';
import StandardDialog from '../../components/common/StandardDialog';
import { useBoolean } from '../../hooks';

const ActionTypes = {
  decline: 'Decline',
  validate: 'Validate',
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${({ theme }) => theme.spacing(3)}px;
  & > button {
    margin-right: ${({ theme }) => theme.spacing(2)}px;
  }
`;

const isNilOrEmpty = anyPass([isNil, isEmpty]);

const Actions = ({ selected }) => {
  const dispatch = useDispatch();
  const { isLoading, success } = useSelector((state) => state.processDocument);
  const confirmationDialog = useBoolean(false);
  const [actionType, setActionType] = useState('');
  const { formatMessage } = useIntl();

  const handleAction = () => {
    dispatch(
      postProcessDocuments(
        selected,
        actionType === ActionTypes.validate,
        actionType,
      ),
    );
  };

  const handleActionConfirmation = (selectedType) => () => {
    setActionType(selectedType);
    confirmationDialog.open();
  };

  useEffect(() => {
    if (success) {
      confirmationDialog.close();
    }
  }, [success]);

  return (
    <>
      <Wrapper>
        <ActionButton
          label={formatMessage({ id: ActionTypes.validate })}
          disabled={isNilOrEmpty(selected) || isLoading}
          onClick={handleActionConfirmation(ActionTypes.validate)}
          icon={<SendIcon />}
        />
        <ActionButton
          label={formatMessage({ id: ActionTypes.decline })}
          color="secondary"
          disabled={isNilOrEmpty(selected) || isLoading}
          onClick={handleActionConfirmation(ActionTypes.decline)}
          icon={<DeclineIcon />}
        />
      </Wrapper>
      <StandardDialog
        maxWidth="xs"
        fullWidth
        scrollable
        open={confirmationDialog.isOpen}
        onClose={confirmationDialog.close}
        title={formatMessage({ id: 'Confirmation' })}
        actions={[
          actionType === ActionTypes.validate ? (
            <ActionButton
              key={0}
              label={formatMessage({ id: ActionTypes.validate })}
              onClick={handleAction}
              icon={<SendIcon />}
              loading={isLoading}
            />
          ) : (
            <ActionButton
              key={0}
              label={formatMessage({ id: ActionTypes.decline })}
              color="secondary"
              onClick={handleAction}
              icon={<DeclineIcon />}
              loading={isLoading}
            />
          ),
        ]}
      >
        {`${formatMessage({ id: actionType || ActionTypes.validate })} ${
          selected.length
        } ${formatMessage({ id: 'document(s)' })}`}
      </StandardDialog>
    </>
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
};
