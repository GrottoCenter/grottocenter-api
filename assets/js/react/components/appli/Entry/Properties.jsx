import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Typography, Tooltip } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import styled from 'styled-components';
import { isNil } from 'ramda';
import {
  GpsFixed,
  Terrain,
  Waves,
  CalendarToday,
  Category,
  TrendingUp,
  Public,
} from '@material-ui/icons';
import CustomIcon from '../../common/CustomIcon';
import EntryRating from './Rating';
import { isValidCoordinates } from './EntryMap';
import { EntryContext } from './Provider';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const RatingWrapper = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.spacing(2)}px;
`;

const SecondaryPropertiesWrapper = styled.div`
  display: flex;
  justify-content: space-evenly;
  flex-wrap: wrap;
`;

const PropertyWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(1)}px;
  & > svg {
    margin-right: ${({ theme }) => theme.spacing(1)}px;
  }
`;

const StyledTypography = styled(Typography)`
  margin-left: ${({ theme, variant }) =>
    variant === 'caption' && theme.spacing(2)}px;
`;

const Property = ({
  loading = false,
  label,
  value,
  icon,
  secondary = false,
}) => (
  <PropertyWrapper>
    {!isNil(icon) && icon}
    <Tooltip title={label}>
      {loading ? (
        <Skeleton variant="text" width="100%" />
      ) : (
        <StyledTypography variant={secondary ? 'caption' : 'body1'}>
          {value || ''}
        </StyledTypography>
      )}
    </Tooltip>
  </PropertyWrapper>
);

Property.propTypes = {
  loading: PropTypes.bool,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  // eslint-disable-next-line react/forbid-prop-types
  icon: PropTypes.object,
  secondary: PropTypes.bool,
};

const Properties = () => {
  const {
    state: {
      details: {
        localisation,
        depth,
        development,
        interestRate,
        progressionRate,
        accessRate,
        undergroundType,
        discoveryYear,
        coordinates,
        mountain,
        altitude,
        isDivingCave,
      },
      loading,
    },
  } = useContext(EntryContext);
  const { formatMessage } = useIntl();
  const makeCoordinatesValue = (coordinatesValue) =>
    `${formatMessage({
      id: 'Latitude',
    })}: ${coordinatesValue[0].toFixed(4)} - ${formatMessage({
      id: 'Longitude',
    })}: ${coordinatesValue[1].toFixed(4)}`;

  return (
    <Wrapper>
      {isValidCoordinates(coordinates) && (
        <Property
          loading={loading}
          label={formatMessage({ id: 'Coordinates' })}
          value={makeCoordinatesValue(coordinates)}
          icon={<GpsFixed fontSize="large" color="primary" />}
        />
      )}
      <Property
        loading={loading}
        label={formatMessage({ id: 'Localisation' })}
        value={localisation}
        icon={<Public fontSize="large" color="primary" />}
      />
      <Property
        loading={loading}
        label={formatMessage({ id: 'Depth' })}
        value={`${depth} m`}
        icon={<CustomIcon type="depth" />}
      />
      <Property
        loading={loading}
        label={formatMessage({ id: 'Development' })}
        value={`${development} m`}
        icon={<CustomIcon type="length" />}
      />
      <SecondaryPropertiesWrapper>
        {discoveryYear && (
          <Property
            label={formatMessage({ id: 'Year of discovery' })}
            value={discoveryYear}
            icon={<CalendarToday color="primary" />}
            secondary
          />
        )}
        {undergroundType && (
          <Property
            label={formatMessage({ id: 'Underground type' })}
            value={undergroundType}
            icon={<Category color="primary" />}
            secondary
          />
        )}
        {mountain && (
          <Property
            label={formatMessage({ id: 'Mountain range' })}
            value={mountain}
            icon={<Terrain color="primary" />}
            secondary
          />
        )}
        {altitude && (
          <Property
            label={formatMessage({ id: 'Altitude' })}
            value={`${altitude} m`}
            icon={<TrendingUp color="primary" />}
            secondary
          />
        )}
        {isDivingCave && (
          <Property
            label={formatMessage({ id: 'Diving cave' })}
            value={formatMessage({
              id: isDivingCave ? 'Diving cave' : 'Not diving',
            })}
            icon={<Waves color="primary" />}
            secondary
          />
        )}
      </SecondaryPropertiesWrapper>
      <RatingWrapper>
        <EntryRating
          label={formatMessage({ id: 'Interest' })}
          value={interestRate || 0}
        />
        <EntryRating
          label={formatMessage({ id: 'Progression' })}
          value={progressionRate || 0}
        />
        <EntryRating
          label={formatMessage({ id: 'Access' })}
          value={accessRate || 0}
        />
      </RatingWrapper>
    </Wrapper>
  );
};

export default Properties;
