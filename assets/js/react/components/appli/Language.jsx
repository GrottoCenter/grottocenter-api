import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@material-ui/core/Avatar';
import LanguageIcon from '@material-ui/icons/Translate';

const Language = () => (
   <Avatar icon={<LanguageIcon style={{color: 'red'}} />} />
);

Language.propTypes ={
  title: PropTypes.string,
  subtitle: PropTypes.string
}

export default Language;
