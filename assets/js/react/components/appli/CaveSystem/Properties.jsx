import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import {
  Terrain,
  Waves,
  CalendarToday,
  Category,
  TrendingUp,
  Public,
} from '@material-ui/icons';

import CustomIcon from '../../common/CustomIcon';
import Rating from '../../common/Properties/Rating';
import { isValidPositions } from '../../common/Maps/MapMultipleMarkers';
import { Property } from '../../common/Properties';
import EntriesSelection from './EntriesSelection';
import { CaveContext } from './Provider';

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

const Properties = () => {
  const {
    state: {
      cave: {
        localisation,
        depth,
        development,
        interestRate,
        progressionRate,
        accessRate,
        undergroundType,
        discoveryYear,
        mountain,
        altitude,
        isDivingCave,
      },
      coordinates,
      selectedEntries,
      entries,
      loading,
    },
    action: { onSelectEntry },
  } = useContext(CaveContext);
  const { formatMessage } = useIntl();

  return (
    <Wrapper>
      {isValidPositions(coordinates) && (
        <EntriesSelection
          onSelect={onSelectEntry}
          loading={loading}
          entries={entries}
          selection={selectedEntries}
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
        <Rating
          label={formatMessage({ id: 'Interest' })}
          value={interestRate || 0}
        />
        <Rating
          label={formatMessage({ id: 'Progression' })}
          value={progressionRate || 0}
        />
        <Rating
          label={formatMessage({ id: 'Access' })}
          value={accessRate || 0}
        />
      </RatingWrapper>
    </Wrapper>
  );
};

export default Properties;
