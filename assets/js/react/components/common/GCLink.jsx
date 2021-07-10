import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * This component encapsulate hypertext links on GC
 * Internal links are compliants with ReactRouter routing
 *
 * href: (mandatory) Contains the target url of the link
 * internal: (optional) Used to define if the link target has to be opened on a new window (by default, a new window is opened)
 * className: (optional) Used to set the CSS classes
 * activeClassName: (optional) Used to set the CSS classes when link is active
 * styles: (optional) Used to apply inline CSS styling
 * children: (Required) The DOM content contained inside the link
 */
const GCLink = ({
  onClick,
  className,
  activeClassName,
  style,
  internal,
  href,
  children,
}) => {
  const params = {};
  if (onClick) {
    params.onClick = onClick;
  }
  if (className) {
    params.className = className;
  }
  if (activeClassName) {
    params.activeClassName = activeClassName;
  }
  if (style) {
    params.style = style;
  }
  if (!internal) {
    return (
      <a href={href} {...params} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} {...params}>
      {children}
    </Link>
  );
};

GCLink.propTypes = {
  href: PropTypes.string.isRequired,
  internal: PropTypes.bool,
  className: PropTypes.string,
  activeClassName: PropTypes.string,
  style: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
};

export default GCLink;
