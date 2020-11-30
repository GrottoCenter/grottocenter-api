import React, { useEffect, useState } from 'react';
import { isNil, anyPass, isEmpty, head, propOr } from 'ramda';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import SendIcon from '@material-ui/icons/Send';
import DeclineIcon from '@material-ui/icons/NotInterested';
import EditIcon from '@material-ui/icons/Edit';
import { postProcessDocuments } from '../../actions/ProcessDocuments';
import ActionButton from '../../components/common/ActionButton';
import StandardDialog from '../../components/common/StandardDialog';
import { useBoolean } from '../../hooks';
import StringInput from '../../components/common/Form/StringInput';

const ActionTypes = {
  edit: {
    confirmationText: '',
    helperText: '',
    name: 'Edit',
  },
  decline: {
    confirmationText: 'Confirmation of document refusal',
    helperText:
      'Indicate to the contributor(s) why you decline the document(s) he / she / they submitted.',
    name: 'Decline',
  },
  validate: {
    confirmationText: 'Confirmation of document approval',
    helperText:
      'Indicate to the contributor(s) why you validate the document(s) he / she / they submitted.',
    name: 'Validate',
  },
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

const Actions = ({ selected, onEdit }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { isLoading, success } = useSelector((state) => state.processDocuments);
  const confirmationDialog = useBoolean(false);
  const [actionType, setActionType] = useState(null);
  const [comment, setComment] = useState('');

  const handleAction = () => {
    dispatch(
      postProcessDocuments(
        selected,
        actionType === ActionTypes.validate,
        comment,
      ),
    );
  };

  const handleActionConfirmation = (selectedType) => () => {
    setActionType(selectedType);
    confirmationDialog.open();
  };

  const handleEdit = () => {
    if (!isEmpty(selected)) {
      onEdit(head(selected));
    }
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
          label={formatMessage({ id: ActionTypes.edit.name })}
          disabled={isNilOrEmpty(selected) || isLoading || selected.length > 1}
          onClick={handleEdit}
          icon={<EditIcon />}
        />
        <ActionButton
          label={formatMessage({ id: ActionTypes.validate.name })}
          disabled={isNilOrEmpty(selected) || isLoading}
          onClick={handleActionConfirmation(ActionTypes.validate)}
          icon={<SendIcon />}
        />
        <ActionButton
          label={formatMessage({ id: ActionTypes.decline.name })}
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
        title={actionType && formatMessage({ id: actionType.confirmationText })}
        actions={[
          <ActionButton
            key={0}
            label={`${formatMessage({
              id: propOr(ActionTypes.validate.name, 'name', actionType),
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
            disabled={actionType === ActionTypes.decline && isEmpty(comment)}
          />,
        ]}
      >
        <StringInput
          helperText={
            !isNil(actionType)
              ? formatMessage({
                  id: actionType.helperText,
                })
              : ''
          }
          multiline
          onValueChange={setComment}
          value={comment}
          valueName={formatMessage({ id: 'Comment' })}
          required={actionType === ActionTypes.decline}
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
  onEdit: PropTypes.func.isRequired,
};
