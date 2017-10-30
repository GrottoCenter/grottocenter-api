import React, {PropTypes} from 'react';
import Avatar from 'material-ui/Avatar';
import LanguageIcon from 'material-ui/svg-icons/action/translate';

const Language = () => (
   <Avatar icon={<LanguageIcon style={{color: 'red'}} />} />
);

Language.propTypes ={
  title: PropTypes.string,
  subtitle: PropTypes.string
}

export default Language;
