import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';

/**
 * Stateless component
 *
 * This component encapsulate hypertext links on GC
 * Internal links are compliants with ReactRouter routing
 *
 * href: (mandatory) Contains the target url of the link
 * internal: (optional) Used to define if the link target has to be opened on a new window (by default, a new window is opened)
 * className: (optional) Used to set the CSS classes
 * activeClassName: (optional) Used to set the CSS classes when link is active
 * styles: (optional) Used to apply inline CSS styling
 * children: (Required) The DOM content conatained inside the link
 */
export default class GCLink extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let params = {};
    if (this.props.onClick) {
      params.onClick = this.props.onClick;
    }
    if (this.props.className) {
      params.className = this.props.className;
    }
    if (this.props.activeClassName) {
      params.activeClassName = this.props.activeClassName;
    }
    if (this.props.style) {
      params.style = this.props.style;
    }
    return (
      <span>
        {!this.props.internal &&
          <a href={this.props.href} {...params} target='_blank'>{this.props.children}</a>
        ||
          <Link to={this.props.href} {...params}>
            {this.props.children}
          </Link>
        }
      </span>
    );
  }
}

GCLink.propTypes = {
  href: PropTypes.string.isRequired,
  internal: PropTypes.bool,
  className: PropTypes.string,
  activeClassName: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired
};
