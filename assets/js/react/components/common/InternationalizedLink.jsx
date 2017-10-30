import React, {PropTypes} from 'react';
import GCLink from './GCLink';

let currentLocale = locale; // eslint-disable-line no-undef

const InternationalizedLink = ({links, className, children}) => (
  <GCLink className={className} href={(links[currentLocale] !== undefined) ? links[currentLocale] : links['*']}>
    {children}
  </GCLink>
);

InternationalizedLink.propTypes = {
  links: PropTypes.any.isRequired,
  className: PropTypes.string,
  children: PropTypes.any
};

export default InternationalizedLink;
