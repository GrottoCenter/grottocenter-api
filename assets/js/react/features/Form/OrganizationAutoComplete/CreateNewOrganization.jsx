import React, { useContext, useEffect, useRef, useState } from 'react';
import { isEmpty, pathOr, isNil } from 'ramda';
import { TextField } from '@material-ui/core';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { postOrganization } from '../../../actions/CreateOrganization';
import ActionButton from '../../../components/common/ActionButton';
import { DocumentFormContext } from '../../../components/appli/Document/DocumentForm/Provider';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const CreateNewOrganization = ({
  defaultValue = '',
  enabled,
  onCreateSuccess,
  contextValueName,
}) => {
  const dispatch = useDispatch();
  const { isLoading, error, organization } = useSelector(
    (state) => state.createOrganization,
  );
  const { updateAttribute } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const inputRef = useRef(null);
  const [organizationName, setOrganizationName] = useState(defaultValue);
  const handleChange = (event) => {
    setOrganizationName(event.target.value);
  };

  const handleSubmit = () => {
    dispatch(postOrganization(organizationName));
  };

  useEffect(() => {
    setOrganizationName(defaultValue);
  }, [defaultValue]);

  // Handle autofocus when opened
  useEffect(() => {
    if (enabled) {
      inputRef.current.focus();
    }
  }, [enabled, inputRef]);

  useEffect(() => {
    if (!isNil(organization) && !isEmpty(organizationName)) {
      updateAttribute(contextValueName, organization);
      if (contextValueName === 'partOf') {
        updateAttribute('editor', pathOr(null, ['editor'], organization));
        updateAttribute('library', pathOr(null, ['library'], organization));
      }
      onCreateSuccess();
      setOrganizationName('');
    }
  }, [organization]);

  return (
    <Wrapper>
      <TextField
        error={!isNil(error) && !isEmpty(organizationName)}
        inputRef={inputRef}
        variant="standard"
        disabled={isLoading}
        label={formatMessage({ id: 'Name' })}
        value={organizationName}
        onChange={handleChange}
        fullWidth
      />
      <ActionButton
        color="secondary"
        label={formatMessage({ id: 'create' })}
        onClick={handleSubmit}
        disabled={isEmpty(organizationName) || isLoading}
        loading={isLoading}
        icon={<AddIcon />}
      />
    </Wrapper>
  );
};

CreateNewOrganization.propTypes = {
  defaultValue: PropTypes.string,
  enabled: PropTypes.bool,
  onCreateSuccess: PropTypes.func,
  contextValueName: PropTypes.string.isRequired,
};

export default CreateNewOrganization;
