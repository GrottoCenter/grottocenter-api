import React from 'react';
import PropTypes from 'prop-types';
import Translate from '../common/Translate';

const Massif = (props) => {
  const { massif } = props;
  return (
    <div>
          <h1>{massif.Name}</h1>

          <p><b><Translate>Inscription date</Translate></b>: {massif.Date_inscription}
          <br />
          <b><Translate>Last reviewed</Translate></b>: {massif.Date_reviewed}</p>
    </div>
  );
};

Massif.propTypes = {
    massif: PropTypes.object.isRequired,
};

export default Massif;
