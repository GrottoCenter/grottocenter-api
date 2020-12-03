import React from 'react';
import PropTypes from 'prop-types';
import Title from './Title';

export const NetworkPopup = ({ network }) => (
  <Title
    title={network.name && network.name.toUpperCase()}
    link={`/ui/caves/${network.id}`}
  />
);

NetworkPopup.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  network: PropTypes.object.isRequired,
};

export default NetworkPopup;
