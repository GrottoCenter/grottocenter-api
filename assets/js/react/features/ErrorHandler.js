import React, { useEffect } from 'react';
import { isNil } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useNotification } from '../hooks';
import { cleanError } from '../actions/Error';

const ErrorHandler = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { error } = useSelector((state) => state.error);
  const { onError, onWarning } = useNotification();

  useEffect(() => {
    if (!isNil(error)) {
      const { message, type } = error;
      const errorMessage = isNil(message)
        ? formatMessage({ id: 'unexpected error' })
        : message;
      switch (Number(type)) {
        case 400:
          onError(
            `${formatMessage({
              id: 'Invalid request',
            })} - ${errorMessage}`,
          );
          break;
        case 404:
          onError(
            `${formatMessage({
              id: 'The resource you are looking was not found',
            })} - ${errorMessage}`,
          );
          break;
        case 409:
          onError(
            `${formatMessage({
              id: 'Conflict',
            })} - ${errorMessage}`,
          );
          break;
        case 500:
          onError(
            `${formatMessage({
              id: 'A server error occurred',
            })} - ${errorMessage}`,
          );
          break;
        case 401:
          onWarning(
            `${formatMessage({
              id: 'You must be authenticated',
            })} - ${errorMessage}`,
          );
          break;
        case 403:
          onWarning(
            `${formatMessage({
              id: 'You are not authorized',
            })} - ${errorMessage}`,
          );
          break;
        default:
          break;
      }
      dispatch(cleanError());
    }
  }, [error]);

  return <div />;
};

export default ErrorHandler;
