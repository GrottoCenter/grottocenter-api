import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

//
//
// M A I N - C O M P O N E N T
//
//

const Translate = (props) => (
  props.children ? <FormattedMessage id={props.children} /> : <FormattedMessage {...props} />
);

Translate.propTypes = {
  children: PropTypes.string
};

Translate.defaultProps = {
  children: null
};

export default Translate;
