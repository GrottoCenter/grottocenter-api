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
  network: PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.number,
  }).isRequired,
};

export default NetworkPopup;
