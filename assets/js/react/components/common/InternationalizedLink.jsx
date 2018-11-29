import React from 'react';
import PropTypes from 'prop-types';
import GCLink from './GCLink';

let currentLocale = locale; // eslint-disable-line no-undef

//
//
// M A I N - C O M P O N E N T
//
//

const InternationalizedLink = ({links, className, children}) => {
  let linkUrl = (links[currentLocale] !== undefined) ? links[currentLocale] : links['*'];
  let linkText = (children) ? children : linkUrl;
  return (
    <GCLink className={className} href={linkUrl}>
      {linkText}
    </GCLink>
  );
};

InternationalizedLink.propTypes = {
  links: PropTypes.any.isRequired,
  className: PropTypes.string,
  children: PropTypes.any
};

export default InternationalizedLink;
