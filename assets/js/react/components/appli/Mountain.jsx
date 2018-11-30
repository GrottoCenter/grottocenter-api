import React from 'react';
import PropTypes from 'prop-types';

const Mountain = (props) => {
  const { mountain } = props;
  return (
    <div>
          <h1>{mountain.Name}</h1>
    </div>
  );
};

Mountain.propTypes = {
    mountain: PropTypes.object.isRequired,
};

export default Mountain;
