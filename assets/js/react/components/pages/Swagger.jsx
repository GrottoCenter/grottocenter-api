import React from 'react';
import PropTypes from 'prop-types';
import ApiDetail from '../appli/ApiDetail';

//
//
// M A I N - C O M P O N E N T
//
//

const Swagger = (props) => {
  const { match: { params: { version } } } = props;
  return (<ApiDetail version={Number.parseInt(version, 10) } />);
};

Swagger.propTypes = {
  match: PropTypes.object.isRequired,
};

export default Swagger;
