import React from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { displayLoginDialog } from '../../actions/Auth';
import { isUserAuth } from '../../helpers/AuthHelper';

import ErrorMessage from '../../components/common/StatusMessage/ErrorMessage';

// ====================

const SpacedButton = styled(Button)`
  ${({ theme }) => `
    margin: ${theme.spacing(1)}px;
`}
`;

const CenteredBlock = styled.div`
  text-align: center;
`;

// ====================

/**
 * The AuthChecker checks if the user is authenticated:
 * - if it's not, it displays an error message
 * - if it is, it displays the provided component
 *
 * @param {PropTypes.element} errorMessageComponent
 *    Component to display if the user is not authenticated
 * @param {PropTypes.element} componentToDisplay
 *    Component to display if the user is authenticated
 */
const AuthChecker = ({ errorMessageComponent, componentToDisplay }) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const authState = useSelector((state) => state.auth);

  const onLoginClick = () => {
    dispatch(displayLoginDialog());
  };

  return (
    <>
      {isUserAuth(authState) ? (
        componentToDisplay
      ) : (
        <CenteredBlock>
          {errorMessageComponent || (
            <>
              <ErrorMessage
                message={formatMessage({
                  id: 'You must be authenticated in order to use this feature.',
                })}
              />
              <SpacedButton onClick={onLoginClick} variant="contained">
                {formatMessage({ id: 'Log in' })}
              </SpacedButton>
              <SpacedButton
                onClick={() => history.push('')}
                variant="contained"
              >
                {formatMessage({ id: 'Go to home page' })}
              </SpacedButton>
            </>
          )}
        </CenteredBlock>
      )}
    </>
  );
};

AuthChecker.propTypes = {
  errorMessageComponent: PropTypes.element,
  componentToDisplay: PropTypes.element.isRequired,
};

export default AuthChecker;
