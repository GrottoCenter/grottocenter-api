import React from 'react';
import PropTypes from 'prop-types';
import Translate from '../common/Translate';

const Mountain = (props) => {
  const { mountain } = props;
  return (
    <div>
          <h1>{mountain.Name}</h1>

          <p><b><Translate>Inscription date</Translate></b>: {mountain.Date_inscription}
          <br />
          <b><Translate>Last reviewed</Translate></b>: {mountain.Date_reviewed}</p>
    </div>
  );
};

Mountain.propTypes = {
    mountain: PropTypes.object.isRequired,
};

export default Mountain;
