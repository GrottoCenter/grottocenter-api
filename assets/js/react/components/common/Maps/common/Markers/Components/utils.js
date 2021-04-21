import { useIntl } from 'react-intl';

// eslint-disable-next-line import/prefer-default-export
export const makeCoordinatesValue = (latitude, longitude) => {
  const { formatMessage } = useIntl();

  return `${formatMessage({
    id: 'Latitude',
  })}: ${latitude.toFixed(4)} - ${formatMessage({
    id: 'Longitude',
  })}: ${longitude.toFixed(4)}`;
};
