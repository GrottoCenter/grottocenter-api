import React, {PropTypes} from 'react';
import I18n from 'react-ghost-i18n';

const Translate = ({children}) => (
  <I18n>{children}</I18n>
);

Translate.propTypes = {
  children: PropTypes.string.isRequired
};

export default Translate;
