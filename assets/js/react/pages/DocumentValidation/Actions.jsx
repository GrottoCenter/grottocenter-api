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
import StringInput from '../../components/common/Form/StringInput';

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
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { isLoading, success } = useSelector((state) => state.processDocuments);
  const confirmationDialog = useBoolean(false);
  const [actionType, setActionType] = useState('');
  const [comment, setComment] = useState('');

  const handleAction = () => {
    dispatch(
      postProcessDocuments(
        selected,
        actionType === ActionTypes.validate,
        isEmpty(comment) ? actionType : comment,
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
      setComment('');
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
          <ActionButton
            key={0}
            label={`${formatMessage({
              id: actionType || ActionTypes.validate,
            })} ${selected.length} ${formatMessage({ id: 'document(s)' })}`}
            color={
              actionType === ActionTypes.validate ? 'primary' : 'secondary'
            }
            onClick={handleAction}
            icon={
              actionType === ActionTypes.validate ? (
                <SendIcon />
              ) : (
                <DeclineIcon />
              )
            }
            loading={isLoading}
          />,
        ]}
      >
        <StringInput
          helperText={`${formatMessage({
            id: 'Add a comment on why the selection has to be',
          })} ${formatMessage({ id: actionType || ActionTypes.validate })}`}
          multiline
          onValueChange={setComment}
          value={comment}
          valueName={formatMessage({ id: 'Comment' })}
        />
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
