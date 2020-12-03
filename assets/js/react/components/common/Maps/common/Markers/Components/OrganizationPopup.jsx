import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { GpsFixed, Public } from '@material-ui/icons';
import Title from './Title';
import { Property } from '../../../../Properties';
import { makeCoordinatesValue } from './utils';

export const OrganizationPopup = ({ organization }) => (
  <>
    <Title
      title={organization.name && organization.name.toUpperCase()}
      link={`/ui/groups/${organization.id}`}
    />
    {!isNil(organization.address) && (
      <Property
        secondary
        value={organization.address}
        icon={<Public color="primary" />}
      />
    )}
    <Property
      secondary
      value={makeCoordinatesValue(
        organization.latitude,
        organization.longitude,
      )}
      icon={<GpsFixed color="primary" />}
    />
  </>
);

OrganizationPopup.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  organization: PropTypes.object.isRequired,
};

export default OrganizationPopup;
