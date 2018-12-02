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
const GCLink = (props) => {
  const params = {};
  if (props.onClick) {
    params.onClick = props.onClick;
  }
  if (props.className) {
    params.className = props.className;
  }
  if (props.activeClassName) {
    params.activeClassName = props.activeClassName;
  }
  if (props.style) {
    params.style = props.style;
  }
  if (!props.internal) {
    return (
      <a href={props.href} {...params} target="_blank">{props.children}</a>
    );
  }
  return (
    <Link to={props.href} {...params}>
      {props.children}
    </Link>
  );
};

GCLink.propTypes = {
  href: PropTypes.string.isRequired,
  internal: PropTypes.bool,
  className: PropTypes.string,
  activeClassName: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
};

export default GCLink;
